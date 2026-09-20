"""Computes Expected Calibration Error (ECE) to ensure predicted probabilities are trustworthy for credit decisions."""

from __future__ import annotations

import logging

import numpy as np

logger = logging.getLogger(__name__)


def expected_calibration_error(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> float:
    """Compute Expected Calibration Error from scratch (no external calibration library).

    ECE measures how well predicted probabilities match observed frequencies.
    A perfectly calibrated model has ECE = 0.

    Args:
        y_true: Ground-truth binary labels (0 or 1).
        y_prob: Predicted probabilities (0–1).
        n_bins: Number of equal-width bins over [0, 1] (default 10).

    Returns:
        The ECE score (float, 0–1).
    """
    y_true = np.asarray(y_true, dtype=float)
    y_prob = np.asarray(y_prob, dtype=float)

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0

    for lo, hi in zip(bin_edges[:-1], bin_edges[1:], strict=True):
        mask = (y_prob >= lo) & (y_prob < hi)
        n = mask.sum()
        if n == 0:
            continue
        bin_acc = y_true[mask].mean()
        bin_conf = y_prob[mask].mean()
        ece += (n / len(y_true)) * abs(bin_acc - bin_conf)

    logger.info("ECE (n_bins=%d) = %.6f", n_bins, float(ece))
    return float(ece)
