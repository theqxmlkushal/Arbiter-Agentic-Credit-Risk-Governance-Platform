"""Automated rollback to last stable champion when an incident is detected."""

from __future__ import annotations

import logging
import subprocess

logger = logging.getLogger(__name__)

_ROLLOUT_NAME = "credit-model-rollout"


def rollback_to_last_stable() -> None:
    """Undo the current Argo Rollout and revert to the last stable revision.

    Runs::

        kubectl argo rollouts undo credit-model-rollout

    This is triggered by the incident handler (``src/monitoring/incident.py``)
    when Prometheus alerts fire for ``HighErrorRate`` or ``FairnessDrift``.
    """
    cmd = ["kubectl", "argo", "rollouts", "undo", _ROLLOUT_NAME]
    logger.warning("ROLLBACK triggered — running: %s", " ".join(cmd))
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    logger.info("Rollback to last stable revision completed for %s.", _ROLLOUT_NAME)
