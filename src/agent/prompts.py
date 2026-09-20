"""Holds the system prompt templates the reasoning node sends to Groq — kept separate from logic for easy iteration/audit."""

from __future__ import annotations

from src.governance.evidence import EvidenceBundle

RATIONALE_PROMPT = (
    "You are a credit-risk governance reviewer.  Given the following evidence "
    "bundle, write a 3-sentence plain-English rationale explaining the "
    "recommended decision.\n\n"
    "Evidence:\n{evidence}"
)


def format_rationale_prompt(evidence: EvidenceBundle) -> str:
    """Render the rationale prompt with the serialised evidence bundle."""
    return RATIONALE_PROMPT.format(evidence=evidence.model_dump_json(indent=2))
