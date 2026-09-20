"""Trains a candidate (logistic regression / XGBoost / LightGBM), logs params+metrics+artifact to MLflow."""

from __future__ import annotations

import logging

import mlflow
from numpy.typing import ArrayLike

logger = logging.getLogger(__name__)

_MODEL_REGISTRY: dict[str, type] = {}


def _get_model_class(model_name: str, params: dict) -> object:
    """Lazy-import and instantiate the appropriate model class."""
    if model_name == "logistic_regression":
        from sklearn.linear_model import LogisticRegression

        return LogisticRegression(**params)
    elif model_name == "xgboost":
        import xgboost as xgb

        return xgb.XGBClassifier(**params)
    elif model_name == "lightgbm":
        import lightgbm as lgb

        return lgb.LGBMClassifier(**params)
    else:
        raise ValueError(
            f"Unsupported model_name={model_name!r}. "
            "Choose from: logistic_regression, xgboost, lightgbm."
        )


def train_candidate(
    model_name: str,
    X_train: ArrayLike,
    y_train: ArrayLike,
    params: dict,
    *,
    tracking_uri: str | None = None,
) -> str:
    """Train a candidate model and log everything to MLflow.

    Args:
        model_name:    One of ``"logistic_regression"``, ``"xgboost"``, ``"lightgbm"``.
        X_train:       Training feature matrix.
        y_train:       Training target vector.
        params:        Hyperparameters passed directly to the model constructor.
        tracking_uri:  Optional MLflow tracking URI override.

    Returns:
        The MLflow ``run_id`` of the training run.
    """
    if tracking_uri:
        mlflow.set_tracking_uri(tracking_uri)

    logger.info("Training candidate model=%s with params=%s", model_name, params)

    with mlflow.start_run(run_name=f"candidate_{model_name}") as run:
        model = _get_model_class(model_name, params)
        model.fit(X_train, y_train)

        mlflow.log_params(params)

        # Log an accuracy metric on the training set for tracking
        train_score = float(model.score(X_train, y_train))
        mlflow.log_metric("train_accuracy", train_score)

        # Serialize model
        mlflow.sklearn.log_model(model, artifact_path="model")

        run_id = run.info.run_id
        logger.info("Training complete — run_id=%s, train_accuracy=%.4f", run_id, train_score)
        return run_id
