"""Thin, cached wrapper around Feast's online (Redis) reads used by the serving layer.

Features:
* In-process TTL cache keyed by ``(entity_id, frozenset(feature_refs))`` to
  avoid redundant Redis round-trips for repeated look-ups within a short
  window (default 5 s).
* Async interface so the FastAPI serving layer can ``await`` it directly.
"""

from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level cache state
# ---------------------------------------------------------------------------
_DEFAULT_TTL_S: float = 5.0
_cache: dict[tuple[str, frozenset[str]], tuple[float, dict[str, Any]]] = {}


def _cache_key(entity_id: str, feature_refs: list[str]) -> tuple[str, frozenset[str]]:
    return (entity_id, frozenset(feature_refs))


async def get_online_features(
    entity_id: str,
    feature_refs: list[str],
    *,
    ttl_s: float = _DEFAULT_TTL_S,
) -> dict[str, Any]:
    """Fetch features from the Feast online store with a short-lived in-process cache.

    Args:
        entity_id:    The applicant/entity key to look up.
        feature_refs: Fully qualified feature references, e.g.
                      ``["credit_features:debt_to_income"]``.
        ttl_s:        Cache time-to-live in seconds (default 5).

    Returns:
        A dict mapping feature names to their values.

    Raises:
        RuntimeError: If the underlying Feast ``FeatureStore`` call fails.
    """
    key = _cache_key(entity_id, feature_refs)

    # Serve from cache when still valid.
    if key in _cache:
        cached_at, cached_val = _cache[key]
        if (time.monotonic() - cached_at) < ttl_s:
            logger.debug("Cache HIT for entity=%s", entity_id)
            return cached_val

    # Cache miss — call the real Feast online store.
    # Import lazily so tests can mock the module without requiring a real
    # Feast / Redis installation.
    try:
        from feast import FeatureStore  # type: ignore[import-untyped]

        store = FeatureStore(repo_path="src/features")
        resp = store.get_online_features(
            features=feature_refs,
            entity_rows=[{"applicant_id": entity_id}],
        )
        result: dict[str, Any] = resp.to_dict()
    except Exception:
        logger.exception("Feast online store call failed for entity=%s", entity_id)
        raise

    _cache[key] = (time.monotonic(), result)
    logger.debug("Cache SET for entity=%s", entity_id)
    return result


def clear_cache() -> None:
    """Evict all cached entries (useful in tests)."""
    _cache.clear()
