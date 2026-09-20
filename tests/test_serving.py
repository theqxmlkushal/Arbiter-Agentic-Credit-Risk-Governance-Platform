"""Tests for the FastAPI Serving Layer (Phase 8).

Covers:
- GET /health  → 200 + {"status": "ok"}
- POST /predict → valid risk_score in [0,1] with mocked model & features
- POST /explain → SHAP values list of correct length
- Malformed request → 422 validation error
- No test makes a real network call to MLflow/Feast/Redis
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

from src.serving.main import app

# ---------------------------------------------------------------------------
# Shared mocks
# ---------------------------------------------------------------------------

_FEATURES = {
    "credit_features:debt_to_income": 0.25,
    "credit_features:credit_utilization": 0.40,
    "credit_features:num_delinquencies_24mo": 1,
    "credit_features:employment_length_years": 5.0,
    "credit_features:loan_to_value": 0.75,
}


def _mock_model() -> MagicMock:
    """Return a mock model whose predict_proba returns [0.85, 0.15]."""
    mock = MagicMock()
    mock.predict_proba.return_value = np.array([[0.85, 0.15]])
    return mock


def _mock_explainer() -> MagicMock:
    """Return a mock SHAP explainer with 5 feature values."""
    mock = MagicMock()
    mock.shap_values.return_value = np.array([0.1, -0.05, 0.03, 0.02, -0.08])
    return mock


@pytest.fixture()
def client() -> TestClient:
    """Provide a TestClient with mocked model and explainer on app.state.

    The lifespan is allowed to run (and fail to load the real model), then we
    override app.state with our mocks before yielding the client.
    """
    mock_model = _mock_model()
    mock_explainer = _mock_explainer()

    with (
        patch("src.serving.routes.predict.get_online_features") as mock_feat,
        patch("src.serving.routes.explain.get_online_features") as mock_exp_feat,
    ):
        mock_feat.return_value = _FEATURES
        mock_exp_feat.return_value = _FEATURES

        with TestClient(app) as c:
            # Override whatever the lifespan set — our mocks are authoritative
            app.state.model = mock_model
            app.state.explainer = mock_explainer
            yield c


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_returns_200_and_status_ok(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------


class TestPredict:
    def test_returns_valid_risk_score(self, client: TestClient) -> None:
        resp = client.post("/predict", json={"applicant_id": "A001"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["applicant_id"] == "A001"
        assert 0.0 <= body["risk_score"] <= 1.0

    def test_model_predict_proba_called(self, client: TestClient) -> None:
        client.post("/predict", json={"applicant_id": "A001"})
        app.state.model.predict_proba.assert_called()

    def test_online_features_called(self, client: TestClient) -> None:
        client.post("/predict", json={"applicant_id": "A999"})
        import src.serving.routes.predict as predict_mod

        predict_mod.get_online_features.assert_called()


# ---------------------------------------------------------------------------
# POST /explain
# ---------------------------------------------------------------------------


class TestExplain:
    def test_returns_shap_values_of_correct_length(self, client: TestClient) -> None:
        resp = client.post("/explain", json={"applicant_id": "A001"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["applicant_id"] == "A001"
        assert isinstance(body["shap_values"], list)
        # 5 features → 5 SHAP values
        assert len(body["shap_values"]) == 5
        assert all(isinstance(v, float) for v in body["shap_values"])


# ---------------------------------------------------------------------------
# Malformed request → 422
# ---------------------------------------------------------------------------


class TestMalformedRequest:
    def test_missing_applicant_id_returns_422(self, client: TestClient) -> None:
        resp = client.post("/predict", json={})
        assert resp.status_code == 422
        detail = resp.json()
        assert "detail" in detail

    def test_missing_applicant_id_explain_returns_422(self, client: TestClient) -> None:
        resp = client.post("/explain", json={})
        assert resp.status_code == 422

    def test_completely_empty_body_returns_422(self, client: TestClient) -> None:
        resp = client.post(
            "/predict",
            content=b"",
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 422
