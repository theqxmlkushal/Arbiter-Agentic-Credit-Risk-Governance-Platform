"""Decides whether drift is transient noise or a persistent shift worth triggering retraining, using a rolling window vote."""

from __future__ import annotations

import logging

from src.drift.detector import DriftReport

logger = logging.getLogger(__name__)


def is_persistent_drift(
    recent_reports: list[DriftReport],
    min_consecutive: int = 3,
) -> bool:
    """Return ``True`` only if the last *min_consecutive* reports all show ``dataset_drift=True``.

    This rolling-window vote prevents a single noisy drift alert from
    triggering a full retraining cycle.

    Args:
        recent_reports: Sequence of recent :class:`DriftReport` objects,
                        ordered chronologically (oldest first).
        min_consecutive: Minimum number of consecutive drift-positive reports
                         required (default 3).

    Returns:
        ``True`` when the last *min_consecutive* reports all flagged drift.
    """
    if len(recent_reports) < min_consecutive:
        logger.debug(
            "Not enough reports (%d) to evaluate persistence (need %d).",
            len(recent_reports),
            min_consecutive,
        )
        return False

    tail = recent_reports[-min_consecutive:]
    persistent = all(r.dataset_drift for r in tail)

    if persistent:
        logger.warning("Persistent drift detected across the last %d reports.", min_consecutive)
    else:
        logger.info("Drift is not persistent — retraining not triggered.")

    return persistent
