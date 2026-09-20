"""/explain endpoint — returns SHAP values for a single prediction."""

from __future__ import annotations

import logging

import numpy as np
from fastapi import APIRouter, HTTPException, Request

from src.features.online_store import get_online_features
from src.serving.schemas import ExplainResponse, PredictRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["explain"])

FEATURE_REFS: list[str] = [
    "credit_features:debt_to_income",
    "credit_features:credit_utilization",
    "credit_features:num_delinquencies_24mo",
    "credit_features:employment_length_years",
    "credit_features:loan_to_value",
]


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: PredictRequest, request: Request) -> ExplainResponse:  # type: ignore[type-arg]
    """Return per-feature SHAP values for the given applicant.

    Uses the cached ``TreeExplainer`` stored in ``app.state.explainer``
    at startup time.
    """
    try:
        features = await get_online_features(payload.applicant_id, FEATURE_REFS)
    except Exception as exc:
        logger.exception("Feature fetch failed for applicant=%s", payload.applicant_id)
        raise HTTPException(
            status_code=503,
            detail=f"Feature store unavailable: {exc}",
        ) from exc

    feature_values = [features.get(ref.split(":")[1]) for ref in FEATURE_REFS]
    safe_values = [0.0 if v is None else float(v) for v in feature_values]

    X = np.array([safe_values])
    explainer = request.app.state.explainer
    raw_shap = explainer.shap_values(X)

    # SHAP may return a 1-D array (single sample) or 2-D (n_samples, n_features).
    if isinstance(raw_shap, np.ndarray):
        values = raw_shap[0].tolist() if raw_shap.ndim == 2 else raw_shap.tolist()
    elif isinstance(raw_shap, list):
        values = raw_shap[0] if isinstance(raw_shap[0], list) else raw_shap
    else:
        values = raw_shap

    logger.info(
        "Explain: applicant=%s n_features=%d",
        payload.applicant_id,
        len(values),
    )
    return ExplainResponse(applicant_id=payload.applicant_id, shap_values=values)
