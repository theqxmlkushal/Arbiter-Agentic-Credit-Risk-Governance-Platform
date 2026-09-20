"""Wraps MLflow Model Registry transitions (None → Staging → Production/Archived)."""

from __future__ import annotations

import logging
from typing import Literal

from mlflow.entities.model_registry import ModelVersion
from mlflow.tracking import MlflowClient

logger = logging.getLogger(__name__)

_VALID_STAGES = Literal["Staging", "Production", "Archived"]


def register_model(run_id: str, name: str) -> ModelVersion:
    """Register a trained model from *run_id* under the registry name *name*.

    Args:
        run_id: The MLflow run ID that contains the logged model artifact.
        name:   Registered-model name (created if it does not exist).

    Returns:
        The :class:`ModelVersion` object created by MLflow.
    """
    client = MlflowClient()
    model_version = client.create_model_version(
        name=name,
        source=f"runs:/{run_id}/model",
        run_id=run_id,
    )
    logger.info(
        "Registered model version: name=%s version=%s run_id=%s",
        name,
        model_version.version,
        run_id,
    )
    return model_version


def transition_stage(
    name: str,
    version: int,
    stage: _VALID_STAGES,
) -> None:
    """Transition a model version to a new stage in the MLflow Model Registry.

    Args:
        name:    Registered-model name.
        version: Model version number.
        stage:   Target stage — one of ``"Staging"``, ``"Production"``, ``"Archived"``.
    """
    client = MlflowClient()
    client.transition_model_version_stage(
        name=name,
        version=version,
        stage=stage,
    )
    logger.info(
        "Transitioned model %s v%d → %s.", name, version, stage
    )
