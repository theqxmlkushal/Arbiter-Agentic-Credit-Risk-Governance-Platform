"""Tests for the LangGraph Governance Agent (Phase 7).

Covers:
- decision_node — truth table mapping verdict → decision
- reasoning_node — mocked LLM, no real API call
- build_arbiter_graph — full end-to-end run with mocked LLM
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.agent.graph import build_arbiter_graph
from src.agent.nodes import decision_node, inspect_node, reasoning_node
from src.agent.state import ArbiterState
from src.drift.detector import DriftReport
from src.governance.evidence import EvidenceBundle
from src.validation.report import ValidationReport

# ============================================================================
# Fixtures
# ============================================================================


def _make_evidence(verdict: str = "pass") -> EvidenceBundle:
    return EvidenceBundle(
        validation=ValidationReport(
            performance={"roc_auc": 0.85, "gini": 0.70},
            fairness={"demographic_parity_difference": 0.05, "equalized_odds_difference": 0.02},
            calibration=0.03,
            passed_hard_constraints=True,
        ),
        drift=DriftReport(drifted_features=[], dataset_drift=False),
        policy_verdict=verdict,
    )


def _make_state(verdict: str = "pass") -> ArbiterState:
    return ArbiterState(
        evidence=_make_evidence(verdict),
        reasoning_trace=[],
    )


# ============================================================================
# decision_node
# ============================================================================


class TestDecisionNode:
    @pytest.mark.parametrize(
        "verdict,expected",
        [
            ("pass", "promote"),
            ("fail", "reject"),
            ("review", "human_review"),
        ],
        ids=["pass→promote", "fail→reject", "review→human_review"],
    )
    def test_truth_table(self, verdict: str, expected: str) -> None:
        state = _make_state(verdict)
        result = decision_node(state)
        assert result["decision"] == expected
        assert len(result["reasoning_trace"]) == 1


# ============================================================================
# inspect_node
# ============================================================================


class TestInspectNode:
    def test_appends_summary_to_trace(self) -> None:
        state = _make_state("pass")
        result = inspect_node(state)
        assert len(result["reasoning_trace"]) == 1
        assert "policy_verdict=pass" in result["reasoning_trace"][0]


# ============================================================================
# reasoning_node
# ============================================================================


class TestReasoningNode:
    def test_mocked_llm_sets_rationale(self) -> None:
        state = _make_state("pass")

        mock_response = MagicMock()
        mock_response.content = "The model is well-calibrated and fair."

        with patch("src.agent.nodes.ChatGroq") as mock_cls:
            mock_cls.return_value.invoke.return_value = mock_response
            result = reasoning_node(state)

        assert result["rationale"] == "The model is well-calibrated and fair."
        assert len(result["reasoning_trace"]) == 1  # reasoning_node adds one entry


# ============================================================================
# build_arbiter_graph — full e2e
# ============================================================================


class TestBuildArbiterGraph:
    def test_full_run_with_mocked_llm(self) -> None:
        graph = build_arbiter_graph()

        mock_response = MagicMock()
        mock_response.content = "Promote — the candidate meets all governance thresholds."

        with patch("src.agent.nodes.ChatGroq") as mock_cls:
            mock_cls.return_value.invoke.return_value = mock_response
            final_state = graph.invoke(_make_state("pass"))

        assert final_state["decision"] == "promote"
        assert final_state["rationale"] == "Promote — the candidate meets all governance thresholds."
        # reasoning_trace should have at least 2 entries (inspect + reason)
        assert len(final_state["reasoning_trace"]) >= 2

    def test_reject_branch(self) -> None:
        graph = build_arbiter_graph()

        mock_response = MagicMock()
        mock_response.content = "Reject — AUC too low."

        with patch("src.agent.nodes.ChatGroq") as mock_cls:
            mock_cls.return_value.invoke.return_value = mock_response
            final_state = graph.invoke(_make_state("fail"))

        assert final_state["decision"] == "reject"

    def test_human_review_branch(self) -> None:
        graph = build_arbiter_graph()

        mock_response = MagicMock()
        mock_response.content = "Review needed — borderline fairness."

        with patch("src.agent.nodes.ChatGroq") as mock_cls:
            mock_cls.return_value.invoke.return_value = mock_response
            final_state = graph.invoke(_make_state("review"))

        assert final_state["decision"] == "human_review"
