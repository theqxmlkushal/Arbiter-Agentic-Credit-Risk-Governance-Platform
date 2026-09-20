"""Prefect flow tying the whole pipeline together — the thing you'd deploy on a schedule or trigger on a drift alert."""

from __future__ import annotations

import logging
from datetime import datetime

import pandas as pd
from prefect import flow, task

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default constants
# ---------------------------------------------------------------------------

DEFAULT_SCHEMA: dict[str, str] = {
    "applicant_id": "object",
    "as_of_date": "datetime64[ns]",
    "credit_score": "int64",
    "annual_income": "float64",
}

DEFAULT_POLICY_PATH = "src/governance/rules/credit_policy.yaml"
REGISTERED_MODEL_NAME = "credit_champion"
DEFAULT_TARGET = "default"
DEFAULT_CUTOFF = datetime(2024, 6, 1)


# ---------------------------------------------------------------------------
# Task: Ingest
# ---------------------------------------------------------------------------


@task(retries=2, retry_delay_seconds=30)
def ingest_task(dataset_path: str) -> pd.DataFrame:
    """Load and merge raw data sources from *dataset_path*.

    Retries up to 2 times with a 30-second delay because this is an
    I/O-prone step that may hit network or filesystem issues.
    """
    from src.data.ingestion import load_historical

    return load_historical(dataset_path)


# ---------------------------------------------------------------------------
# Task: Validate
# ---------------------------------------------------------------------------


@task
def validate_task(
    df: pd.DataFrame,
    schema: dict[str, str],
) -> object:
    """Run schema validation on *df*. Returns a ``ValidationResult``."""
    from src.data.validation import validate_schema

    return validate_schema(df, schema)


# ---------------------------------------------------------------------------
# Task: Quarantine
# ---------------------------------------------------------------------------


@task
def quarantine_task(df: pd.DataFrame, reason: str) -> None:
    """Write failed rows to quarantine and fire an alert."""
    from src.data.quarantine import quarantine_rows

    quarantine_rows(df, reason=reason)


# ---------------------------------------------------------------------------
# Task: Snapshot
# ---------------------------------------------------------------------------


@task
def snapshot_task(df: pd.DataFrame, name: str) -> str:
    """Persist a validated dataset snapshot via DVC. Returns the SHA-256 hash."""
    from src.data.versioning import snapshot_dataset

    return snapshot_dataset(df, name=name)


# ---------------------------------------------------------------------------
# Task: Drift check
# ---------------------------------------------------------------------------


@task(retries=2, retry_delay_seconds=30)
def drift_check_task(
    reference: pd.DataFrame,
    current: pd.DataFrame,
    min_consecutive: int = 3,
) -> bool:
    """Check whether drift is persistent across recent reports.

    Retries up to 2 times because this may query external data.
    Returns ``True`` when retraining should be triggered.
    """
    from src.drift.detector import detect_drift
    from src.drift.persistence import is_persistent_drift

    # In a production system, recent_reports would be loaded from a store.
    # Here we do a single comparison; the caller passes multiple if available.
    report = detect_drift(reference=reference, current=current)
    return is_persistent_drift([report], min_consecutive=min_consecutive)


# ---------------------------------------------------------------------------
# Task: Drift report (for evidence)
# ---------------------------------------------------------------------------


@task(retries=2, retry_delay_seconds=30)
def drift_report_task(
    reference: pd.DataFrame,
    current: pd.DataFrame,
) -> object:
    """Produce a DriftReport for evidence compilation.

    Retries up to 2 times because evidently may hit transient issues.
    """
    from src.drift.detector import detect_drift

    return detect_drift(reference=reference, current=current)


# ---------------------------------------------------------------------------
# Task: Retrain
# ---------------------------------------------------------------------------


@task
def retrain_task(
    df: pd.DataFrame,
    target: str,
    cutoff_date: datetime,
    model_name: str = "logistic_regression",
) -> str:
    """Build splits, train a candidate, and return the MLflow run_id."""
    from src.training.dataset_builder import build_splits
    from src.training.trainer import train_candidate

    train, test = build_splits(df, target=target, cutoff_date=cutoff_date)

    feature_cols = [
        c
        for c in train.columns
        if c not in (target, "as_of_date", "applicant_id", "source", "sample_weight")
    ]
    X_train = train[feature_cols].values
    y_train = train[target].values

    return train_candidate(
        model_name=model_name,
        X_train=X_train,
        y_train=y_train,
        params={"max_iter": 200, "random_state": 42},
    )


# ---------------------------------------------------------------------------
# Task: Register model
# ---------------------------------------------------------------------------


@task
def register_task(run_id: str, name: str) -> int:
    """Register the trained model in MLflow. Returns the version number."""
    from src.training.registry import register_model

    mv = register_model(run_id=run_id, name=name)
    return int(mv.version)


# ---------------------------------------------------------------------------
# Task: Validate model
# ---------------------------------------------------------------------------


@task
def validate_model_task(
    y_true: object,
    y_scores: object,
    sensitive_features: object,
    min_auc: float = 0.75,
    max_dpd: float = 0.1,
) -> object:
    """Run the validation engine on the candidate model's predictions."""
    import numpy as np

    from src.validation.calibration import expected_calibration_error
    from src.validation.fairness import compute_fairness
    from src.validation.performance import compute_performance
    from src.validation.report import build_validation_report

    y_true_arr = np.asarray(y_true)
    y_scores_arr = np.asarray(y_scores)
    sensitive_arr = np.asarray(sensitive_features)

    perf = compute_performance(y_true_arr, y_scores_arr)
    fairness = compute_fairness(y_true_arr, (y_scores_arr >= 0.5).astype(int), sensitive_arr)
    ece = expected_calibration_error(y_true_arr, y_scores_arr)

    return build_validation_report(perf, fairness, ece, min_auc=min_auc, max_dpd=max_dpd)


# ---------------------------------------------------------------------------
# Task: Policy evaluation
# ---------------------------------------------------------------------------


@task
def policy_task(report: object, policy_path: str = DEFAULT_POLICY_PATH) -> str:
    """Evaluate the validation report against governance policy rules."""
    from src.governance.policy_engine import evaluate_policy, load_policy

    policy = load_policy(policy_path)
    return evaluate_policy(report=report, policy=policy)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Task: Compile evidence
# ---------------------------------------------------------------------------


@task
def compile_evidence_task(
    validation_report: object,
    drift_report: object,
    verdict: str,
) -> object:
    """Bundle validation, drift, and policy verdict into an EvidenceBundle."""
    from src.governance.evidence import compile_evidence

    return compile_evidence(
        validation=validation_report,  # type: ignore[arg-type]
        drift=drift_report,  # type: ignore[arg-type]
        verdict=verdict,
    )


# ---------------------------------------------------------------------------
# Task: Agent reasoning
# ---------------------------------------------------------------------------


@task
def agent_task(evidence: object) -> str:
    """Run the LangGraph governance agent and return the decision."""
    from src.agent.graph import build_arbiter_graph
    from src.agent.state import ArbiterState

    graph = build_arbiter_graph()

    initial_state: ArbiterState = {
        "evidence": evidence,  # type: ignore[typeddict-item]
        "reasoning_trace": [],
    }

    final_state = graph.invoke(initial_state)  # type: ignore[attr-defined]
    return str(final_state["decision"])


# ---------------------------------------------------------------------------
# Task: Deploy or reject
# ---------------------------------------------------------------------------


@task
def deploy_or_reject_task(
    decision: str,
    model_name: str,
    version: int,
) -> None:
    """Branch on agent decision: promote, reject, or human_review."""
    from src.deployment.promoter import promote_to_staging, start_canary
    from src.training.registry import transition_stage

    if decision == "promote":
        promote_to_staging(model_name=model_name, version=version)
        start_canary(model_name=model_name, version=version)
    elif decision == "reject":
        transition_stage(name=model_name, version=version, stage="Archived")
    else:
        # human_review — leave in Staging for manual inspection
        transition_stage(name=model_name, version=version, stage="Staging")
        logger.info("Model %s v%d left in Staging for human review.", model_name, version)


# ---------------------------------------------------------------------------
# Task: Audit log
# ---------------------------------------------------------------------------


@task
def audit_task(evidence: object, decision: str, rationale: str) -> None:
    """Write the governance decision to the immutable audit log."""
    from src.audit.logger import log_decision

    log_decision(evidence=evidence, decision=decision, rationale=rationale)


# ---------------------------------------------------------------------------
# Main flow
# ---------------------------------------------------------------------------


@flow(name="governance-pipeline")
def governance_pipeline(
    dataset_path: str,
    *,
    force_retrain: bool = False,
    target: str = DEFAULT_TARGET,
    cutoff_date: datetime = DEFAULT_CUTOFF,
    schema: dict[str, str] | None = None,
    policy_path: str = DEFAULT_POLICY_PATH,
    model_name: str = REGISTERED_MODEL_NAME,
) -> None:
    """End-to-end governance pipeline: ingest → validate → drift → retrain → decide → deploy.

    Args:
        dataset_path:   Path to the raw Parquet dataset.
        force_retrain:  When ``True``, skip the drift check and retrain immediately.
        target:         Name of the binary target column.
        cutoff_date:    Date threshold for train/test splitting.
        schema:         Expected column-dtype schema for validation.
        policy_path:    Path to the YAML governance policy file.
        model_name:     Registered model name in MLflow.
    """
    if schema is None:
        schema = DEFAULT_SCHEMA

    # ── Step 1: Ingest ──────────────────────────────────────────────
    logger.info("Pipeline started — dataset_path=%s", dataset_path)
    df = ingest_task(dataset_path=dataset_path)

    # ── Step 2: Validate ────────────────────────────────────────────
    validation_result = validate_task(df=df, schema=schema)
    if not validation_result.is_valid:  # type: ignore[attr-defined]
        logger.warning("Validation failed — quarantining %d rows.", len(df))  # type: ignore[arg-type]
        quarantine_task(df=df, reason="schema_validation_failed")
        logger.info("Pipeline short-circuited: validation failed.")
        return

    # ── Step 3: Snapshot ────────────────────────────────────────────
    sha256 = snapshot_task(df=df, name="latest")
    logger.info("Dataset snapshot complete — sha256=%s", sha256)

    # ── Step 4: Drift check ─────────────────────────────────────────
    # In production the reference would be loaded from a store; here we
    # use the same data as a no-op baseline.
    should_retrain = force_retrain
    if not should_retrain:
        is_drifted = drift_check_task(reference=df, current=df)
        should_retrain = is_drifted

    if not should_retrain:
        logger.info("No persistent drift detected — retraining skipped.")
        return

    logger.info("Retraining triggered (force_retrain=%s).", force_retrain)

    # ── Step 5: Train candidate ─────────────────────────────────────
    run_id = retrain_task(
        df=df,
        target=target,
        cutoff_date=cutoff_date,
        model_name="logistic_regression",
    )
    logger.info("Candidate trained — run_id=%s", run_id)

    # ── Step 6: Register ────────────────────────────────────────────
    version = register_task(run_id=run_id, name=model_name)
    logger.info("Model registered — name=%s version=%d", model_name, version)

    # ── Step 7: Validate model ──────────────────────────────────────
    # Synthetic validation data for demonstration — in production this
    # would come from the held-out test set.
    import numpy as np

    rng = np.random.RandomState(42)
    y_true = rng.randint(0, 2, size=200)
    y_scores = rng.rand(200)
    sensitive = rng.randint(0, 2, size=200)

    validation_report = validate_model_task(
        y_true=y_true,
        y_scores=y_scores,
        sensitive_features=sensitive,
    )

    # ── Step 8: Drift report for evidence ───────────────────────────
    drift_report = drift_report_task(reference=df, current=df)

    # ── Step 9: Policy ──────────────────────────────────────────────
    verdict = policy_task(report=validation_report, policy_path=policy_path)
    logger.info("Policy verdict: %s", verdict)

    # ── Step 10: Compile evidence ───────────────────────────────────
    evidence = compile_evidence_task(
        validation_report=validation_report,
        drift_report=drift_report,
        verdict=verdict,
    )

    # ── Step 11: Agent ──────────────────────────────────────────────
    decision = agent_task(evidence=evidence)
    logger.info("Agent decision: %s", decision)

    # ── Step 12: Deploy / Reject / Human Review ─────────────────────
    deploy_or_reject_task(
        decision=decision,
        model_name=model_name,
        version=version,
    )

    # ── Step 13: Audit log ──────────────────────────────────────────
    rationale = f"Pipeline completed with decision={decision}, policy_verdict={verdict}."
    audit_task(evidence=evidence, decision=decision, rationale=rationale)
    logger.info("Pipeline complete — decision=%s", decision)
