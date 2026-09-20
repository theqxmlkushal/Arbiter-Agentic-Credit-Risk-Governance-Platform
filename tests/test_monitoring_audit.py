"""Tests for Monitoring & Immutable Audit Log (Phase 10).

Covers:
- record_prediction — Histogram sample count increments after a call
- handle_alert — table-driven: "HighErrorRate" and "FairnessDrift" trigger rollback, others don't
- log_decision — mock supabase.create_client, assert .table().insert() called correctly
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from src.monitoring.metrics import (
    PREDICTION_LATENCY,
    PREDICTION_SCORE,
    record_prediction,
)

# ============================================================================
# metrics.py
# ============================================================================


class TestRecordPrediction:
    def test_histogram_count_increments(self) -> None:
        """After one call, the histogram's sample count should be >= 1."""
        # Record the current sample count before the call.
        before = PREDICTION_LATENCY.collect()[0].samples
        count_before = sum(s.value for s in before if s.name == "prediction_latency_seconds_count")

        record_prediction(latency_s=0.042, score=0.87)

        after = PREDICTION_LATENCY.collect()[0].samples
        count_after = sum(s.value for s in after if s.name == "prediction_latency_seconds_count")
        assert count_after == count_before + 1

    def test_score_histogram_count_increments(self) -> None:
        before = PREDICTION_SCORE.collect()[0].samples
        count_before = sum(s.value for s in before if s.name == "prediction_score_count")

        record_prediction(latency_s=0.01, score=0.33)

        after = PREDICTION_SCORE.collect()[0].samples
        count_after = sum(s.value for s in after if s.name == "prediction_score_count")
        assert count_after == count_before + 1


# ============================================================================
# incident.py
# ============================================================================


class TestHandleAlert:
    def _call(self, payload: dict) -> MagicMock:
        """Call handle_alert with a mocked rollback_to_last_stable."""
        with patch("src.monitoring.incident.rollback_to_last_stable") as mock_rb:
            from src.monitoring.incident import handle_alert

            handle_alert(payload)
            return mock_rb

    def test_high_error_rate_triggers_rollback(self) -> None:
        mock = self._call({"alertname": "HighErrorRate"})
        mock.assert_called_once()

    def test_fairness_drift_triggers_rollback(self) -> None:
        mock = self._call({"alertname": "FairnessDrift"})
        mock.assert_called_once()

    def test_unrelated_alert_does_not_trigger_rollback(self) -> None:
        mock = self._call({"alertname": "DiskSpaceLow"})
        mock.assert_not_called()

    def test_alertname_in_labels_subkey(self) -> None:
        """Alertmanager v2 nests alertname inside 'labels'."""
        mock = self._call({"labels": {"alertname": "HighErrorRate"}})
        mock.assert_called_once()

    def test_empty_payload_does_not_crash(self) -> None:
        mock = self._call({})
        mock.assert_not_called()


# ============================================================================
# audit/logger.py
# ============================================================================


class TestLogDecision:
    def test_inserts_correct_payload(self) -> None:
        mock_client = MagicMock()
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.execute.return_value = None

        mock_evidence = MagicMock()
        mock_evidence.model_dump.return_value = {"validation": {}, "drift": {}}

        with patch("supabase.create_client", return_value=mock_client):
            from src.audit.logger import log_decision

            log_decision(
                evidence=mock_evidence,
                decision="promote",
                rationale="All thresholds met.",
                supabase_url="http://fake.supabase.co",
                supabase_key="fake-key",
            )

        mock_client.table.assert_called_once_with("audit_log")
        insert_payload = mock_table.insert.call_args[0][0]
        assert insert_payload["decision"] == "promote"
        assert insert_payload["rationale"] == "All thresholds met."
        assert "evidence" in insert_payload
        assert "created_at" in insert_payload
        mock_table.execute.assert_called_once()
