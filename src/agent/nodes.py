"""Individual graph nodes — inspect evidence, call the LLM to reason, and decide."""

from __future__ import annotations

import logging

from langchain_groq import ChatGroq  # type: ignore[import-untyped]

from src.agent.prompts import format_rationale_prompt
from src.agent.state import ArbiterState

logger = logging.getLogger(__name__)


def inspect_node(state: ArbiterState) -> ArbiterState:
    """Inspect the evidence bundle and append a summary line to the reasoning trace.

    This node is deterministic (no LLM call) — it simply records what was
    observed so downstream nodes have context.
    """
    evidence = state["evidence"]
    summary = (
        f"Inspect: policy_verdict={evidence.policy_verdict}, "
        f"drifted_features={evidence.drift.drifted_features}, "
        f"auc={evidence.validation.performance.get('roc_auc', 'N/A')}"
    )
    state["reasoning_trace"].append(summary)
    logger.info(summary)
    return state


def reasoning_node(state: ArbiterState) -> ArbiterState:
    """Call the LLM (Groq) to produce a plain-English rationale for the decision.

    The LLM response is stored in ``state["rationale"]``.
    """
    prompt = format_rationale_prompt(state["evidence"])

    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    response = llm.invoke(prompt)

    state["rationale"] = response.content
    state["reasoning_trace"].append("LLM rationale generated.")
    logger.info("Reasoning node complete — rationale length=%d chars", len(response.content))
    return state


def decision_node(state: ArbiterState) -> ArbiterState:
    """Map the deterministic policy verdict to a governance decision.

    Mapping (per PROJECT.md §5.21):

    * ``"pass"``  → ``"promote"``
    * ``"fail"``  → ``"reject"``
    * ``"review"`` → ``"human_review"``
    """
    verdict = state["evidence"].policy_verdict
    mapping = {"pass": "promote", "fail": "reject", "review": "human_review"}
    decision = mapping[verdict]

    state["decision"] = decision
    state["reasoning_trace"].append(f"Policy verdict '{verdict}' mapped to '{decision}'.")
    logger.info("Decision node: verdict=%s → decision=%s", verdict, decision)
    return state
