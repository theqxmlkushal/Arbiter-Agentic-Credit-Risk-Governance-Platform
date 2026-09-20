"""Loads and caches a SHAP TreeExplainer bound to the current production model.

Usage::

    from src.serving.explainer import build_explainer

    explainer = build_explainer(loaded_sklearn_model)
    shap_values = explainer.shap_values(feature_matrix)
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def build_explainer(model: Any) -> Any:
    """Create a SHAP ``TreeExplainer`` for the given tree-based model.

    Args:
        model: A fitted tree-based model (XGBoost, LightGBM, or an
               sklearn ``GradientBoostingClassifier`` / ``RandomForestClassifier``).

    Returns:
        A ``shap.TreeExplainer`` instance ready for ``shap_values()`` calls.

    Raises:
        ImportError: If the ``shap`` package is not installed.
    """
    import shap

    explainer = shap.TreeExplainer(model)
    logger.info("SHAP TreeExplainer built for model type=%s", type(model).__name__)
    return explainer
