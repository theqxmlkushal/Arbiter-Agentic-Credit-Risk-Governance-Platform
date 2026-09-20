"""Runs an Evidently DataDriftPreset comparing baseline vs. production distributions and returns a structured verdict."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import pandas as pd
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class DriftReport(BaseModel):
    """Structured output of a drift detection run.

    Attributes:
        drifted_features: Column names where distribution drift was detected.
        dataset_drift:   ``True`` when Evidently considers the overall dataset
                         drifted (majority of columns drifted).
        computed_at:     UTC timestamp of when the report was generated.
    """

    drifted_features: list[str]
    dataset_drift: bool
    computed_at: datetime = None  # type: ignore[assignment]

    def model_post_init(self, __context: object) -> None:
        if self.computed_at is None:
            object.__setattr__(self, "computed_at", datetime.now(timezone.utc))


def detect_drift(reference: pd.DataFrame, current: pd.DataFrame) -> DriftReport:
    """Run Evidently's ``DataDriftPreset`` and return a :class:`DriftReport`.

    Args:
        reference: The baseline (training-time) DataFrame.
        current:   The production (live) DataFrame to compare against.

    Returns:
        A :class:`DriftReport` summarising which features drifted and whether
        the dataset as a whole is considered drifted.
    """
    from evidently.metric_preset import DataDriftPreset  # type: ignore[import-untyped]
    from evidently.report import Report  # type: ignore[import-untyped]

    report = Report(metrics=[DataDriftPreset()])
    report.run(reference_data=reference, current_data=current)

    result = report.as_dict()["metrics"][0]["result"]
    drifted = [
        col
        for col, info in result.get("drift_by_columns", {}).items()
        if info.get("drift_detected", False)
    ]
    dataset_drift: bool = result.get("dataset_drift", False)

    logger.info("Drift report: dataset_drift=%s, drifted_features=%s", dataset_drift, drifted)

    return DriftReport(
        drifted_features=drifted,
        dataset_drift=dataset_drift,
    )
