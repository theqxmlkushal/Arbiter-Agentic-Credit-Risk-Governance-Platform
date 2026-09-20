"""Writes an immutable, append-only audit row to Supabase for every governance decision."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


def log_decision(
    evidence: object,
    decision: str,
    rationale: str,
    *,
    supabase_url: str | None = None,
    supabase_key: str | None = None,
) -> None:
    """Insert a governance decision record into the ``audit_log`` Supabase table.

    Args:
        evidence:      An :class:`~src.governance.evidence.EvidenceBundle` (or any
                       object with a ``model_dump()`` method).
        decision:      The agent's final decision (``"promote"``, ``"reject"``,
                       or ``"human_review"``).
        rationale:     LLM-generated plain-English rationale.
        supabase_url:  Override for the Supabase URL (defaults to
                       ``Settings.supabase_url`` from env).
        supabase_key:  Override for the Supabase anon key (defaults to
                       ``Settings.supabase_key`` from env).
    """
    # Lazy-load config so the module can be imported without env vars set
    # (useful in unit tests that only test other code paths).
    if supabase_url is None or supabase_key is None:
        from src.config import get_settings

        settings = get_settings()
        supabase_url = supabase_url or settings.supabase_url
        supabase_key = supabase_key or settings.supabase_key

    from supabase import create_client  # type: ignore[attr-defined]

    client = create_client(supabase_url, supabase_key)

    evidence_dump: dict[str, Any] = {}
    if hasattr(evidence, "model_dump"):
        evidence_dump = evidence.model_dump()
    elif isinstance(evidence, dict):
        evidence_dump = evidence

    payload = {
        "evidence": evidence_dump,
        "decision": decision,
        "rationale": rationale,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    logger.info("Audit log insert — decision=%s", decision)
    client.table("audit_log").insert(payload).execute()
    logger.info("Audit log insert complete.")
