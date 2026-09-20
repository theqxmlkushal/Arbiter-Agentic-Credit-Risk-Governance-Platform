"""Pydantic request/response models shared across routes."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    """Request payload for the ``/predict`` endpoint."""

    applicant_id: str = Field(..., description="Unique applicant identifier")


class PredictResponse(BaseModel):
    """Response payload for the ``/predict`` endpoint."""

    applicant_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Predicted default probability")


class ExplainResponse(BaseModel):
    """Response payload for the ``/explain`` endpoint."""

    applicant_id: str
    shap_values: list[float] = Field(..., description="Per-feature SHAP contribution values")
