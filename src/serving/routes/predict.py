"""/predict endpoint — fetches online features and returns a risk score, entirely async."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi import APIRouter, HTTPException, Request

from src.features.online_store import get_online_features
from src.serving.schemas import PredictRequest, PredictResponse

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

router = APIRouter(tags=["predict"])

# Features to fetch from the online store for each prediction.
FEATURE_REFS: list[str] = [
    "credit_features:debt_to_income",
    "credit_features:credit_utilization",
    "credit_features:num_delinquencies_24mo",
    "credit_features:employment_length_years",
    "credit_features:loan_to_value",
]


@router.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest, request: Request) -> PredictResponse:
    """Score a single applicant for credit risk.

    1. Fetches the applicant's latest features from the Feast online store.
    2. Runs ``model.predict_proba`` to obtain the default probability.
    3. Returns the risk score in ``[0, 1]``.

    In a Phase 8b extension, SHAP explanation could be fetched concurrently
    with model inference via ``asyncio.gather``::

        features_coro = get_online_features(...)
        shap_coro = asyncio.to_thread(explainer.shap_values, ...)
        features, shap_vals = await asyncio.gather(features_coro, shap_coro)
    """
    try:
        features = await get_online_features(payload.applicant_id, FEATURE_REFS)
    except Exception as exc:
        logger.exception("Feature fetch failed for applicant=%s", payload.applicant_id)
        raise HTTPException(
            status_code=503,
            detail=f"Feature store unavailable: {exc}",
        ) from exc

    # Extract feature values in the same order as FEATURE_REFS.
    model = request.app.state.model
    feature_values = [features.get(ref.split(":")[1]) for ref in FEATURE_REFS]

    # Guard against None values — replace with 0.0 as a safe default.
    safe_values = [0.0 if v is None else float(v) for v in feature_values]

    import numpy as np

    X = np.array([safe_values])
    risk_score = float(model.predict_proba(X)[0][1])

    logger.info(
        "Predict: applicant=%s risk_score=%.4f",
        payload.applicant_id,
        risk_score,
    )
    return PredictResponse(applicant_id=payload.applicant_id, risk_score=risk_score)
