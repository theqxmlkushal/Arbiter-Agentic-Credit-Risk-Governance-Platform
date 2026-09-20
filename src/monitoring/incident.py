"""Consumes Prometheus alert webhooks and decides whether to trigger rollback_to_last_stable()."""

from __future__ import annotations

import logging
from typing import Any

from src.deployment.rollback import rollback_to_last_stable

logger = logging.getLogger(__name__)

# Alert names that should trigger an automatic rollback.
_ROLLBACK_ALERTS: frozenset[str] = frozenset({"HighErrorRate", "FairnessDrift"})


def handle_alert(alert_payload: dict[str, Any]) -> None:
    """Inspect a Prometheus Alertmanager webhook payload and act on it.

    Currently, the only action is an automated rollback when the alert is
    ``HighErrorRate`` or ``FairnessDrift``.

    Args:
        alert_payload: The outer webhook JSON body.  Expected to contain
                       ``"alertname"`` at the top level or inside
                       ``alert_payload["labels"]``.
    """
    # Alertmanager v2 payloads nest labels inside the alert object.
    alertname = alert_payload.get("alertname") or alert_payload.get("labels", {}).get(
        "alertname", ""
    )

    if alertname in _ROLLBACK_ALERTS:
        logger.warning(
            "Alert '%s' matches rollback policy — triggering rollback_to_last_stable().",
            alertname,
        )
        rollback_to_last_stable()
    else:
        logger.info(
            "Alert '%s' does not match rollback policy — no action taken.",
            alertname,
        )
