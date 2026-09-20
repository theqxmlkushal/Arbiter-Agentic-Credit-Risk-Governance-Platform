"""Registers Ray as a joblib backend so GridSearchCV(n_jobs=-1) transparently scales across a cluster — the key 'scalability' talking point."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def enable_distributed_backend(address: str | None = None) -> None:
    """Register Ray as a joblib parallel backend for scikit-learn estimators.

    After calling this, any ``GridSearchCV(n_jobs=-1)`` or similar
    scikit-learn meta-estimator will transparently distribute across a Ray
    cluster.

    If Ray is not installed or cannot connect, a warning is logged and the
    function is a no-op — local dev is never hard-crashed by this call.

    Args:
        address: Ray cluster address (e.g. ``"ray://head:10001"``).
                 When ``None`` or ``"auto"``, Ray connects to an existing
                 cluster or starts a local one.
    """
    try:
        import ray  # type: ignore[import-untyped]
        from ray.util.joblib import register_ray  # type: ignore[import-untyped]

        init_kwargs: dict = {"ignore_reinit_error": True}
        if address:
            init_kwargs["address"] = address

        ray.init(**init_kwargs)
        register_ray()
        logger.info("Ray joblib backend registered (address=%s).", address or "auto")
    except ImportError:
        logger.warning(
            "Ray is not installed — distributed backend not registered. "
            "Training will use local cores only."
        )
    except Exception as exc:
        logger.warning(
            "Could not initialise Ray (%s) — distributed backend not registered.",
            exc,
        )
