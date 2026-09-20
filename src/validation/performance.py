"""Computes ROC-AUC, Gini, and KS statistic; compares candidate vs. current champion."""

from __future__ import annotations

import logging

import numpy as np
from sklearn.metrics import roc_auc_score

logger = logging.getLogger(__name__)


def compute_performance(y_true: np.ndarray, y_scores: np.ndarray) -> dict[str, float]:
    """Compute ROC-AUC and Gini coefficient for a set of predictions.

    Args:
        y_true:   Ground-truth binary labels (0/1).
        y_scores: Predicted probabilities (continuous, 0–1).

    Returns:
        Dict with keys ``"roc_auc"`` and ``"gini"``.
    """
    auc = float(roc_auc_score(y_true, y_scores))
    gini = float(2 * auc - 1)
    logger.info("Performance — roc_auc=%.4f, gini=%.4f", auc, gini)
    return {"roc_auc": auc, "gini": gini}


def is_significant_improvement(
    champion_auc: float,
    candidate_auc: float,
    threshold: float = 0.01,
) -> bool:
    """Return ``True`` if *candidate_auc* exceeds *champion_auc* by at least *threshold*.

    Args:
        champion_auc:   ROC-AUC of the current production model.
        candidate_auc:  ROC-AUC of the new candidate model.
        threshold:      Minimum absolute improvement required (default 0.01 = 1 pp).
    """
    improvement = candidate_auc - champion_auc
    significant = improvement >= threshold
    logger.info(
        "Improvement check: champion=%.4f, candidate=%.4f, delta=%.4f → %s",
        champion_auc,
        candidate_auc,
        improvement,
        "significant" if significant else "not significant",
    )
    return significant
