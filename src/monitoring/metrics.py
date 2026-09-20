"""Defines Prometheus custom metrics (prediction latency, score distribution, error rate) exposed at /metrics."""

from __future__ import annotations

import logging

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default registry — importable for tests that want to inspect samples.
# ---------------------------------------------------------------------------
REGISTRY = CollectorRegistry(auto_describe=True)

# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

PREDICTION_LATENCY = Histogram(
    "prediction_latency_seconds",
    "End-to-end latency of /predict requests in seconds",
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=REGISTRY,
)

PREDICTION_SCORE = Histogram(
    "prediction_score",
    "Distribution of risk scores returned by /predict",
    buckets=(0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0),
    registry=REGISTRY,
)

PREDICTION_ERRORS = Counter(
    "prediction_errors_total",
    "Total number of failed prediction requests",
    registry=REGISTRY,
)


def record_prediction(latency_s: float, score: float) -> None:
    """Observe a single prediction's latency and risk score.

    Args:
        latency_s: Wall-clock time of the request in seconds.
        score:     Risk score (0–1) returned by the model.
    """
    PREDICTION_LATENCY.observe(latency_s)
    PREDICTION_SCORE.observe(score)
    logger.debug("Recorded prediction — latency=%.4fs, score=%.4f", latency_s, score)


def metrics_response() -> tuple[bytes, str]:
    """Generate a Prometheus ``text/plain`` exposition of all registered metrics.

    Returns:
        ``(body_bytes, content_type)`` ready to be returned by a FastAPI route.
    """
    return generate_latest(REGISTRY), CONTENT_TYPE_LATEST
