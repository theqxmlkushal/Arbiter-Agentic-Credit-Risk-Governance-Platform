"""Wires nodes into the LangGraph state machine (the actual inspect → reason → decide loop)."""

from __future__ import annotations

import logging

from langgraph.graph import END, StateGraph  # type: ignore[import-untyped]

from src.agent.nodes import decision_node, inspect_node, reasoning_node
from src.agent.state import ArbiterState

logger = logging.getLogger(__name__)


def build_arbiter_graph() -> object:
    """Build and compile the Arbiter governance agent graph.

    Graph topology::

        START → inspect → reason → decide → END

    Returns:
        A compiled LangGraph ``CompiledGraph`` ready to be invoked with
        an initial :class:`ArbiterState`.
    """
    graph = StateGraph(ArbiterState)

    graph.add_node("inspect", inspect_node)
    graph.add_node("reason", reasoning_node)
    graph.add_node("decide", decision_node)

    graph.set_entry_point("inspect")
    graph.add_edge("inspect", "reason")
    graph.add_edge("reason", "decide")
    graph.add_edge("decide", END)

    compiled = graph.compile()
    logger.info("Arbiter agent graph compiled: inspect → reason → decide → END")
    return compiled
