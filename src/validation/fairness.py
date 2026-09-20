"""Runs Fairlearn disparate-impact and demographic-parity checks across a protected attribute."""

from __future__ import annotations

import logging

import numpy as np
from fairlearn.metrics import (  # type: ignore[import-untyped]
    demographic_parity_difference,
    equalized_odds_difference,
)

logger = logging.getLogger(__name__)


def compute_fairness(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    sensitive_features: np.ndarray,
) -> dict[str, float]:
    """Compute fairness metrics across a protected attribute.

    Args:
        y_true:             Ground-truth binary labels.
        y_pred:             Predicted binary labels.
        sensitive_features: Array of the protected attribute (e.g. gender code).

    Returns:
        Dict with ``"demographic_parity_difference"`` and
        ``"equalized_odds_difference"``.
    """
    dpd = float(demographic_parity_difference(
        y_true, y_pred, sensitive_features=sensitive_features
    ))
    eod = float(equalized_odds_difference(
        y_true, y_pred, sensitive_features=sensitive_features
    ))

    logger.info(
        "Fairness — dpd=%.4f, eod=%.4f", dpd, eod
    )
    return {
        "demographic_parity_difference": dpd,
        "equalized_odds_difference": eod,
    }
