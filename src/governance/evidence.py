"""Packages validation report + drift report + policy verdict into a single evidence bundle handed to the agent."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from pydantic import BaseModel

from src.drift.detector import DriftReport
from src.validation.report import ValidationReport

logger = logging.getLogger(__name__)


class EvidenceBundle(BaseModel):
    """Complete evidence package for the LangGraph governance agent.

    Attributes:
        validation:     The full :class:`ValidationReport`.
        drift:          The most recent :class:`DriftReport`.
        policy_verdict: Deterministic verdict from :func:`evaluate_policy`.
        compiled_at:    UTC timestamp when this bundle was created.
    """

    validation: ValidationReport
    drift: DriftReport
    policy_verdict: str
    compiled_at: datetime = None  # type: ignore[assignment]

    def model_post_init(self, __context: object) -> None:
        if self.compiled_at is None:
            object.__setattr__(self, "compiled_at", datetime.now(timezone.utc))


def compile_evidence(
    validation: ValidationReport,
    drift: DriftReport,
    verdict: str,
) -> EvidenceBundle:
    """Assemble an :class:`EvidenceBundle` from its component parts.

    Args:
        validation: Output of :func:`build_validation_report`.
        drift:      Output of :func:`detect_drift`.
        verdict:    String verdict from :func:`evaluate_policy`.

    Returns:
        A fully populated :class:`EvidenceBundle`.
    """
    bundle = EvidenceBundle(
        validation=validation,
        drift=drift,
        policy_verdict=verdict,
    )
    logger.info("Evidence bundle compiled — verdict=%s", verdict)
    return bundle
