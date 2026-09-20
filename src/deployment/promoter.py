"""Drives the staged rollout — transitions the MLflow stage and patches the Argo Rollout CR to start the canary."""

from __future__ import annotations

import logging
import subprocess

from src.training.registry import transition_stage

logger = logging.getLogger(__name__)

_ROLLOUT_NAME = "credit-model-rollout"


def promote_to_staging(model_name: str, version: int) -> None:
    """Transition *model_name* v*version* to the ``Staging`` stage in MLflow.

    This is the first gate after a candidate passes validation — the model
    is now eligible for shadow / canary deployment but is **not** yet
    serving production traffic.

    Args:
        model_name: Registered-model name in the MLflow Model Registry.
        version:    Integer model version number.
    """
    logger.info("Promoting %s v%d → Staging …", model_name, version)
    transition_stage(name=model_name, version=version, stage="Staging")
    logger.info("Promotion to Staging complete for %s v%d.", model_name, version)


def start_canary(model_name: str, version: int) -> None:
    """Patch the Argo Rollout CR to point at the new canary image.

    Runs::

        kubectl argo rollouts set image credit-model-rollout \\
            credit-model=<model_name>:<version>

    The Argo Rollout spec (``k8s/rollout/canary-rollout.yaml``) defines the
    canary weight steps (5 % → 25 % → 100 %) and the analysis template for
    automated rollback on error-rate or fairness-drift.

    Args:
        model_name: Container image name (without the tag).
        version:    Image tag (typically the git SHA or semver).
    """
    image_ref = f"{model_name}:{version}"
    cmd = [
        "kubectl",
        "argo",
        "rollouts",
        "set",
        "image",
        _ROLLOUT_NAME,
        f"credit-model={image_ref}",
    ]
    logger.info("Starting canary rollout: %s", " ".join(cmd))
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    logger.info("Canary rollout set image succeeded for %s.", image_ref)
