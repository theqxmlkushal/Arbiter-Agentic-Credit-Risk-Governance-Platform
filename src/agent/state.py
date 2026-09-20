"""Defines the typed state object that flows through the LangGraph graph."""

from __future__ import annotations

from typing import Literal, TypedDict

from typing_extensions import NotRequired

from src.governance.evidence import EvidenceBundle


class ArbiterState(TypedDict):
    """State schema for the Arbiter governance agent graph.

    Attributes:
        evidence:          The complete evidence bundle for evaluation.
        reasoning_trace:   Accumulating list of reasoning steps (strings).
        decision:          Final governance decision (set by ``decision_node``).
        rationale:         LLM-generated plain-English rationale.
    """

    evidence: EvidenceBundle
    reasoning_trace: list[str]
    decision: NotRequired[Literal["promote", "reject", "human_review"]]
    rationale: NotRequired[str]
