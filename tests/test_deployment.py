"""Tests for the Deployment layer (Phase 9).

Covers:
- promote_to_staging — calls registry.transition_stage with stage="Staging"
- start_canary — constructs the exact kubectl argo rollouts command
- rollback_to_last_stable — calls kubectl argo rollouts undo
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from src.deployment.promoter import promote_to_staging, start_canary
from src.deployment.rollback import rollback_to_last_stable


class TestPromoteToStaging:
    def test_calls_transition_stage_with_staging(self) -> None:
        with patch("src.deployment.promoter.transition_stage") as mock_ts:
            promote_to_staging("credit_champion", 3)

        mock_ts.assert_called_once_with(
            name="credit_champion",
            version=3,
            stage="Staging",
        )


class TestStartCanary:
    def test_constructs_correct_kubectl_command(self) -> None:
        with patch("src.deployment.promoter.subprocess") as mock_sub:
            mock_sub.run.return_value = MagicMock(returncode=0)
            start_canary("arbiter-api", "abc1234")

        mock_sub.run.assert_called_once()
        cmd = mock_sub.run.call_args[0][0]
        assert cmd == [
            "kubectl",
            "argo",
            "rollouts",
            "set",
            "image",
            "credit-model-rollout",
            "credit-model=arbiter-api:abc1234",
        ]

    def test_check_true_passed_to_subprocess(self) -> None:
        with patch("src.deployment.promoter.subprocess") as mock_sub:
            mock_sub.run.return_value = MagicMock(returncode=0)
            start_canary("model", "v1")

        _, kwargs = mock_sub.run.call_args
        assert kwargs["check"] is True


class TestRollbackToLastStable:
    def test_calls_kubectl_undo(self) -> None:
        with patch("src.deployment.rollback.subprocess") as mock_sub:
            mock_sub.run.return_value = MagicMock(returncode=0)
            rollback_to_last_stable()

        mock_sub.run.assert_called_once()
        cmd = mock_sub.run.call_args[0][0]
        assert cmd == [
            "kubectl",
            "argo",
            "rollouts",
            "undo",
            "credit-model-rollout",
        ]

    def test_check_true_passed_to_subprocess(self) -> None:
        with patch("src.deployment.rollback.subprocess") as mock_sub:
            mock_sub.run.return_value = MagicMock(returncode=0)
            rollback_to_last_stable()

        _, kwargs = mock_sub.run.call_args
        assert kwargs["check"] is True
