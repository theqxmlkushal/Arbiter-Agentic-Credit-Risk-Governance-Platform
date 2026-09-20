"""Tests for the Governance Policy Engine (Phase 6).

Covers:
- load_policy — loads the real YAML file
- evaluate_policy — table-driven tests with 5+ cases including boundary
- compile_evidence — asserts all fields populated
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pytest

from src.drift.detector import DriftReport
from src.governance.evidence import EvidenceBundle, compile_evidence
from src.governance.policy_engine import evaluate_policy, load_policy
from src.validation.report import ValidationReport

POLICY_PATH = str(
    Path(__file__).resolve().parent.parent / "src" / "governance" / "rules" / "credit_policy.yaml"
)


# ============================================================================
# load_policy
# ============================================================================


class TestLoadPolicy:
    def test_loads_real_yaml(self) -> None:
        policy = load_policy(POLICY_PATH)
        assert "min_auc" in policy
        assert "max_dpd" in policy
        assert "max_ece" in policy
        assert "min_gini" in policy


# ============================================================================
# evaluate_policy
# ============================================================================


def _report(
    auc: float = 0.85,
    dpd: float = 0.05,
    ece: float = 0.03,
) -> ValidationReport:
    return ValidationReport(
        performance={"roc_auc": auc, "gini": 2 * auc - 1},
        fairness={"demographic_parity_difference": dpd, "equalized_odds_difference": 0.0},
        calibration=ece,
        passed_hard_constraints=True,
    )


_POLICY = {"min_auc": 0.75, "max_dpd": 0.1, "max_ece": 0.05}


class TestEvaluatePolicy:
    @pytest.mark.parametrize(
        "report,policy,expected",
        [
            # Case 1: pass — everything well within limits
            (_report(auc=0.85, dpd=0.05, ece=0.03), _POLICY, "pass"),
            # Case 2: fail — AUC below minimum
            (_report(auc=0.65, dpd=0.05, ece=0.03), _POLICY, "fail"),
            # Case 3: review — DPD borderline (0.12 > 0.1 but <= 0.2)
            (_report(auc=0.85, dpd=0.12, ece=0.03), _POLICY, "review"),
            # Case 4: fail — DPD egregiously high (0.3 > 2*0.1)
            (_report(auc=0.85, dpd=0.30, ece=0.03), _POLICY, "fail"),
            # Case 5: review — ECE borderline (0.07 > 0.05 but <= 0.10)
            (_report(auc=0.85, dpd=0.05, ece=0.07), _POLICY, "review"),
            # Case 6: fail — ECE egregiously high (0.20 > 2*0.05)
            (_report(auc=0.85, dpd=0.05, ece=0.20), _POLICY, "fail"),
            # Case 7: boundary — AUC exactly at threshold → pass
            (_report(auc=0.75, dpd=0.0, ece=0.0), _POLICY, "pass"),
            # Case 8: boundary — DPD exactly at threshold → pass
            (_report(auc=0.85, dpd=0.1, ece=0.0), _POLICY, "pass"),
        ],
        ids=[
            "pass_normal",
            "fail_low_auc",
            "review_borderline_dpd",
            "fail_egregious_dpd",
            "review_borderline_ece",
            "fail_egregious_ece",
            "boundary_auc_at_threshold",
            "boundary_dpd_at_threshold",
        ],
    )
    def test_table_driven(
        self,
        report: ValidationReport,
        policy: dict,
        expected: str,
    ) -> None:
        assert evaluate_policy(report, policy) == expected


# ============================================================================
# compile_evidence
# ============================================================================


class TestCompileEvidence:
    def test_all_fields_populated(self) -> None:
        val = _report()
        drift = DriftReport(drifted_features=[], dataset_drift=False)
        bundle = compile_evidence(val, drift, "pass")

        assert isinstance(bundle, EvidenceBundle)
        assert bundle.validation == val
        assert bundle.drift == drift
        assert bundle.policy_verdict == "pass"
        assert isinstance(bundle.compiled_at, datetime)
        assert bundle.compiled_at.tzinfo is not None  # timezone-aware
