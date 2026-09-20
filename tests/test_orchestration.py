"""Tests for the Prefect orchestration layer (Phase 11).

Covers:
- Pipeline short-circuits on validation failure (quarantine + no snapshot)
- Happy path (promote) calls promote_to_staging + start_canary + log_decision
- Reject path calls transition_stage("Archived") and does NOT call start_canary
- Human-review path calls transition_stage("Staging") and does NOT call start_canary
- All tests run via prefect_test_harness — zero external Prefect dependency
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pandas as pd
from prefect.testing.utilities import prefect_test_harness

import src.orchestration.flows as flows


def _make_validation_result(is_valid: bool = True) -> MagicMock:
    result = MagicMock()
    result.is_valid = is_valid
    return result


def _make_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "applicant_id": ["A001", "A002"],
            "as_of_date": pd.to_datetime(["2024-01-01", "2024-01-02"]),
            "credit_score": [720, 650],
            "annual_income": [85000.0, 54000.0],
        }
    )


# ============================================================================
# Short-circuit on validation failure
# ============================================================================


class TestShortCircuitOnValidationFailure:
    def test_does_not_call_snapshot_when_validation_fails(self) -> None:
        df = _make_df()
        mock_validation = _make_validation_result(is_valid=False)

        with (
            prefect_test_harness(),
            patch.object(flows, "ingest_task", return_value=df) as mock_ingest,
            patch.object(flows, "validate_task", return_value=mock_validation) as mock_val,
            patch.object(flows, "quarantine_task") as mock_quarantine,
            patch.object(flows, "snapshot_task") as mock_snapshot,
            patch.object(flows, "drift_check_task") as mock_drift,
            patch.object(flows, "drift_report_task") as mock_drift_report,
            patch.object(flows, "retrain_task") as mock_retrain,
            patch.object(flows, "deploy_or_reject_task") as mock_deploy,
            patch.object(flows, "audit_task") as mock_audit,
        ):
            flows.governance_pipeline("data/test.parquet")

        mock_ingest.assert_called_once()
        mock_val.assert_called_once()
        mock_quarantine.assert_called_once_with(df=df, reason="schema_validation_failed")
        mock_snapshot.assert_not_called()
        mock_drift.assert_not_called()
        mock_drift_report.assert_not_called()
        mock_retrain.assert_not_called()
        mock_deploy.assert_not_called()
        mock_audit.assert_not_called()


# ============================================================================
# Happy path — promote
# ============================================================================


class TestHappyPathPromote:
    def test_promote_calls_promote_to_staging_and_start_canary(self) -> None:
        df = _make_df()
        validation = _make_validation_result(is_valid=True)

        with (
            prefect_test_harness(),
            patch.object(flows, "ingest_task", return_value=df),
            patch.object(flows, "validate_task", return_value=validation),
            patch.object(flows, "snapshot_task", return_value="abc123hash"),
            patch.object(flows, "drift_check_task", return_value=False),
            patch.object(flows, "drift_report_task", return_value=MagicMock()),
            patch.object(flows, "retrain_task", return_value="run_42"),
            patch.object(flows, "register_task", return_value=7),
            patch.object(flows, "validate_model_task", return_value=MagicMock()),
            patch.object(flows, "compile_evidence_task", return_value=MagicMock()),
            patch.object(flows, "policy_task", return_value="pass"),
            patch.object(flows, "agent_task", return_value="promote"),
            patch("src.deployment.promoter.promote_to_staging") as mock_promote,
            patch("src.deployment.promoter.start_canary") as mock_canary,
            patch("src.training.registry.transition_stage") as mock_transition,
            patch("src.audit.logger.log_decision") as mock_log,
        ):
            flows.governance_pipeline("data/test.parquet", force_retrain=True)

        mock_promote.assert_called_once_with(model_name="credit_champion", version=7)
        mock_canary.assert_called_once_with(model_name="credit_champion", version=7)
        mock_transition.assert_not_called()
        mock_log.assert_called_once()
        _, kwargs = mock_log.call_args
        assert kwargs["decision"] == "promote"
        assert kwargs["rationale"] is not None


# ============================================================================
# Reject branch
# ============================================================================


class TestRejectBranch:
    def test_reject_archives_and_no_canary(self) -> None:
        df = _make_df()
        validation = _make_validation_result(is_valid=True)

        with (
            prefect_test_harness(),
            patch.object(flows, "ingest_task", return_value=df),
            patch.object(flows, "validate_task", return_value=validation),
            patch.object(flows, "snapshot_task", return_value="abc123hash"),
            patch.object(flows, "drift_check_task", return_value=False),
            patch.object(flows, "drift_report_task", return_value=MagicMock()),
            patch.object(flows, "retrain_task", return_value="run_42"),
            patch.object(flows, "register_task", return_value=7),
            patch.object(flows, "validate_model_task", return_value=MagicMock()),
            patch.object(flows, "compile_evidence_task", return_value=MagicMock()),
            patch.object(flows, "policy_task", return_value="fail"),
            patch.object(flows, "agent_task", return_value="reject"),
            patch("src.deployment.promoter.promote_to_staging") as mock_promote,
            patch("src.deployment.promoter.start_canary") as mock_canary,
            patch("src.training.registry.transition_stage") as mock_transition,
            patch("src.audit.logger.log_decision") as mock_log,
        ):
            flows.governance_pipeline("data/test.parquet", force_retrain=True)

        mock_transition.assert_called_once_with(
            name="credit_champion", version=7, stage="Archived",
        )
        mock_promote.assert_not_called()
        mock_canary.assert_not_called()
        mock_log.assert_called_once()
        _, kwargs = mock_log.call_args
        assert kwargs["decision"] == "reject"


# ============================================================================
# Human-review branch
# ============================================================================


class TestHumanReviewBranch:
    def test_human_review_stays_in_staging(self) -> None:
        df = _make_df()
        validation = _make_validation_result(is_valid=True)

        with (
            prefect_test_harness(),
            patch.object(flows, "ingest_task", return_value=df),
            patch.object(flows, "validate_task", return_value=validation),
            patch.object(flows, "snapshot_task", return_value="abc123hash"),
            patch.object(flows, "drift_check_task", return_value=False),
            patch.object(flows, "drift_report_task", return_value=MagicMock()),
            patch.object(flows, "retrain_task", return_value="run_42"),
            patch.object(flows, "register_task", return_value=7),
            patch.object(flows, "validate_model_task", return_value=MagicMock()),
            patch.object(flows, "compile_evidence_task", return_value=MagicMock()),
            patch.object(flows, "policy_task", return_value="review"),
            patch.object(flows, "agent_task", return_value="human_review"),
            patch("src.deployment.promoter.promote_to_staging") as mock_promote,
            patch("src.deployment.promoter.start_canary") as mock_canary,
            patch("src.training.registry.transition_stage") as mock_transition,
            patch("src.audit.logger.log_decision") as mock_log,
        ):
            flows.governance_pipeline("data/test.parquet", force_retrain=True)

        mock_transition.assert_called_once_with(
            name="credit_champion", version=7, stage="Staging",
        )
        mock_promote.assert_not_called()
        mock_canary.assert_not_called()
        mock_log.assert_called_once()
        _, kwargs = mock_log.call_args
        assert kwargs["decision"] == "human_review"
