# BUILD_PHASES.md — Arbiter Phased Implementation Plan

This is the execution companion to `PROJECT.md`. It breaks the build into 13 sequential phases, each independently shippable and testable. Every phase has a **ready-to-paste prompt** for an IDE coding agent (Claude Code, Cursor, etc.) and a **test checklist** so you never move to the next phase on unverified ground.

**How to use this file:**
1. Work phases in order — each assumes the previous phase's files exist.
2. Upload/attach `PROJECT.md` alongside each prompt (or paste the relevant file-blueprint section) so the agent has the exact function signatures.
3. After the agent finishes a phase, run the listed tests before moving on.
4. Commit after each phase (`git commit -m "phase N: <name>"`) — this gives you a clean, resume-worthy commit history too.

---

## Phase 0 — Repo Scaffolding & Environment

**Goal:** Empty-but-correct skeleton: directory tree, dependency files, config loader, Docker/K8s stubs, CI skeleton.

**Deliverables:** Full directory tree from `PROJECT.md` §4 (empty `__init__.py` where needed), `requirements.txt`, `pyproject.toml`, `.env.example`, `src/config.py`, `Dockerfile.api`, `Dockerfile.worker`, `docker-compose.yml`, `.github/workflows/ci.yml` (lint+test only, no deploy yet).

### Prompt for IDE agent
```
You are setting up Phase 0 of the "Arbiter" MLOps project. I've attached PROJECT.md which contains the full architecture, tech stack, and directory tree.

Do the following:
1. Create the exact directory structure from PROJECT.md §4, with empty __init__.py files in every Python package directory.
2. Write requirements.txt pinning: fastapi, uvicorn, pydantic, pydantic-settings, pandas, pyarrow,
   scikit-learn, xgboost, lightgbm, mlflow, dvc, feast, redis, evidently, fairlearn, shap,
   langgraph, langchain-groq, prefect, supabase, prometheus-client, pytest, pytest-cov, ruff, mypy.
3. Write pyproject.toml with ruff + mypy config (Python 3.11 target, strict mypy on src/).
4. Implement src/config.py exactly per PROJECT.md §5.1 (Pydantic BaseSettings, get_settings() with lru_cache).
5. Write .env.example listing every env var config.py expects, with placeholder values.
6. Write Dockerfile.api (multi-stage, python:3.11-slim base, installs requirements, runs uvicorn src.serving.main:app).
7. Write Dockerfile.worker (same base, runs prefect worker).
8. Write docker-compose.yml with services: redis, mlflow (using ghcr.io/mlflow/mlflow image with a local backend store), and a placeholder api service building from Dockerfile.api.
9. Write .github/workflows/ci.yml with three jobs: lint (ruff check .), typecheck (mypy src/), test (pytest --cov=src) — no build/push/deploy steps yet.
10. Do NOT implement any business logic yet — every module beyond config.py should just be an empty file with a one-line docstring describing its future purpose (copy the "Purpose" line from PROJECT.md for that file).

After finishing, list every file you created.
```

### Tests (Phase 0)
- `pytest` runs (even with zero real tests) and exits 0.
- `ruff check .` and `mypy src/` both pass with no errors.
- `from src.config import get_settings; get_settings()` succeeds when `.env` is populated from `.env.example`.
- `docker compose config` validates without error.

---

## Phase 1 — Data Ingestion, Validation & Versioning

**Goal:** Raw data in → validated, versioned, DVC-tracked dataset out. Bad rows quarantined, not dropped.

**Files:** `src/data/ingestion.py`, `src/data/validation.py`, `src/data/quarantine.py`, `src/data/versioning.py`.

### Prompt
```
Phase 1 of Arbiter: implement the data layer. Reference PROJECT.md §5.2–5.5 for exact function signatures and snippets — expand those snippets into full, production-quality implementations (add docstrings, type hints, logging, and error handling; do not just copy the snippet verbatim).

Implement:
1. src/data/ingestion.py — load_historical(path), load_live_batch(since), merge_sources(frames). Assume Parquet inputs. merge_sources must dedupe on (applicant_id, as_of_date).
2. src/data/validation.py — ValidationResult pydantic model, validate_schema(df, schema), check_ranges(df, ranges). Schema is a dict[str,str] of column->dtype; ranges is dict[str, tuple[float,float]].
3. src/data/quarantine.py — quarantine_rows(df, reason) writing to a local quarantine/ folder as timestamped parquet, and alert_on_quarantine(count, reason) that just logs a warning for now (leave a TODO for Slack/Prometheus integration).
4. src/data/versioning.py — snapshot_dataset(df, name) that writes to data/versioned/, runs `dvc add` via subprocess, and returns a sha256 hash of the file.

Also write tests/test_data_layer.py covering:
- merge_sources dedupes correctly on a synthetic 2-frame example with overlapping applicant_id+as_of_date
- validate_schema catches a missing column and a dtype mismatch, and passes on a clean frame
- check_ranges flags an out-of-range value
- quarantine_rows writes a file and calls alert_on_quarantine exactly once (use unittest.mock)
- snapshot_dataset returns a 64-character hex string (mock subprocess.run so the test doesn't require a real DVC remote)

Use pytest fixtures for the synthetic DataFrames. Do not hit the network or DVC remote in tests — mock everything external.
```

### Tests (Phase 1)
- [ ] `merge_sources` dedup test passes
- [ ] `validate_schema` positive + 2 negative cases pass
- [ ] `check_ranges` flags correctly
- [ ] `quarantine_rows` writes file + triggers alert (mocked)
- [ ] `snapshot_dataset` returns valid sha256-length string with mocked subprocess
- [ ] `pytest --cov=src/data` shows ≥85% coverage on this module

---

## Phase 2 — Feature Store (Feast)

**Goal:** Offline features materialize from the versioned dataset; online store (Redis) serves them with low latency.

**Files:** `src/features/feature_repo.py`, `src/features/transformations.py`, `src/features/online_store.py`.

### Prompt
```
Phase 2 of Arbiter: implement the Feast feature store layer, per PROJECT.md §5.6–5.7.

1. src/features/feature_repo.py — define the `applicant` Entity, a FileSource pointing at data/versioned/features.parquet, and a `credit_features_view` FeatureView with at least 5 realistic credit-risk features (debt_to_income, credit_utilization, num_delinquencies_24mo, employment_length_years, loan_to_value). Include a feature_store.yaml alongside it configured for local file offline store + Redis online store.
2. src/features/transformations.py — pure functions that derive each engineered feature from raw columns (e.g. compute_debt_to_income(monthly_debt, monthly_income) -> float), fully typed, with docstrings and edge-case handling (e.g. division by zero -> return None or a capped value, your choice, documented).
3. src/features/online_store.py — async get_online_features(entity_id, feature_refs) using the Feast FeatureStore singleton, with an in-process TTL cache (functools or a small dict+timestamp cache) to avoid redundant Redis round-trips within a configurable TTL (default 5s).

Write tests/test_features.py:
- unit tests for each transformation function including at least one edge case each (e.g. zero income)
- a test that the cache in online_store.py returns the cached value on a second call within TTL without calling the underlying Feast store again (mock the FeatureStore.get_online_features call and assert call_count == 1 after two get_online_features() calls)
- do NOT require a live Redis instance — mock feast.FeatureStore entirely

Explain in a short comment block at the top of feature_repo.py how `feast apply` and `feast materialize` would be run against this repo.
```

### Tests (Phase 2)
- [ ] Each transformation function has a passing edge-case test
- [ ] Online store cache hit test passes (mocked, call_count == 1)
- [ ] `feast validate` (or a dry-run import of feature_repo.py) raises no errors

---

## Phase 3 — Drift & Health Engine

**Goal:** Detect distribution drift between baseline and production data, and distinguish noise from a persistent shift.

**Files:** `src/drift/detector.py`, `src/drift/persistence.py`.

### Prompt
```
Phase 3 of Arbiter: implement drift detection, per PROJECT.md §5.8–5.9.

1. src/drift/detector.py — DriftReport pydantic model (drifted_features: list[str], dataset_drift: bool, computed_at: datetime), and detect_drift(reference, current) using Evidently's Report + DataDriftPreset.
2. src/drift/persistence.py — is_persistent_drift(recent_reports, min_consecutive=3): returns True only if the last `min_consecutive` reports all show dataset_drift=True.

Write tests/test_drift.py:
- a synthetic test where `current` is drawn from a shifted distribution vs `reference` (e.g. shift a numeric column's mean by several standard deviations) and assert dataset_drift is True
- a synthetic test where reference and current are drawn from the same distribution and assert dataset_drift is False (allow this test to be marked flaky-tolerant with a fixed random seed)
- is_persistent_drift: test with [True, True, True] -> True, [True, False, True] -> False, and fewer than min_consecutive reports -> False

Use numpy with a fixed seed for all synthetic data so tests are deterministic.
```

### Tests (Phase 3)
- [ ] Drift detected on deliberately shifted synthetic data
- [ ] No false-positive drift on identical distributions (seeded)
- [ ] `is_persistent_drift` truth table fully covered (3 cases minimum)

---

## Phase 4 — Training & Model Registry

**Goal:** Train a candidate, track it in MLflow, register it, and support scaling training via Ray.

**Files:** `src/training/dataset_builder.py`, `src/training/trainer.py`, `src/training/distributed_backend.py`, `src/training/registry.py`.

### Prompt
```
Phase 4 of Arbiter: implement the training pipeline, per PROJECT.md §5.10–5.13.

1. src/training/dataset_builder.py — build_splits(df, target, cutoff_date) doing a time-based split (train = rows before cutoff_date, test = on/after), with recency weighting (a sample_weight column that decays exponentially with age) and check_leakage(train, test, key) that raises ValueError on any overlapping key.
2. src/training/trainer.py — train_candidate(model_name, X_train, y_train, params) supporting model_name in {"logistic_regression","xgboost","lightgbm"} (dispatch to the right sklearn/XGBoost/LightGBM class), logging params + the fitted model to MLflow, returning the run_id.
3. src/training/distributed_backend.py — enable_distributed_backend(address=None) registering Ray as a joblib backend, with a fallback that logs a warning and no-ops if `ray` isn't installed/available (don't hard-crash local dev).
4. src/training/registry.py — register_model(run_id, name) and transition_stage(name, version, stage) wrapping MlflowClient, with stage restricted to Literal["Staging","Production","Archived"].

Write tests/test_training.py:
- build_splits: assert no row from before cutoff ends up in test, and no key overlap
- check_leakage: assert it raises ValueError on a deliberately overlapping train/test pair
- train_candidate: use a tiny synthetic classification dataset (sklearn make_classification), point MLflow at a local temp file:// tracking URI (use pytest's tmp_path fixture), and assert a run_id is returned and the run exists in MLflow
- registry.py: mock MlflowClient and assert transition_stage calls transition_model_version_stage with the exact arguments passed in

All tests must run offline with no real Ray cluster or remote MLflow server.
```

### Tests (Phase 4)
- [ ] Time-based split has zero temporal leakage
- [ ] `check_leakage` raises on overlap
- [ ] `train_candidate` produces a real MLflow run against a local temp tracking URI
- [ ] `transition_stage` calls the MLflow client correctly (mocked)
- [ ] `enable_distributed_backend` doesn't crash when Ray is absent

---

## Phase 5 — Validation Engine (Performance / Fairness / Calibration)

**Goal:** Every candidate gets scored on performance, fairness, and calibration before it can reach governance.

**Files:** `src/validation/performance.py`, `src/validation/fairness.py`, `src/validation/calibration.py`, `src/validation/report.py`.

### Prompt
```
Phase 5 of Arbiter: implement the validation engine, per PROJECT.md §5.14–5.17.

1. src/validation/performance.py — compute_performance(y_true, y_scores) returning {"roc_auc","gini"}, and is_significant_improvement(champion_auc, candidate_auc, threshold=0.01).
2. src/validation/fairness.py — compute_fairness(y_true, y_pred, sensitive_features) using Fairlearn's demographic_parity_difference (and also add equalized_odds_difference for completeness).
3. src/validation/calibration.py — expected_calibration_error(y_true, y_prob, n_bins=10) implemented from scratch (no external calibration library), fully vectorized with numpy where practical.
4. src/validation/report.py — ValidationReport pydantic model and build_validation_report(perf, fairness, ece, min_auc=0.75, max_dpd=0.1) setting passed_hard_constraints.

Write tests/test_validation.py:
- compute_performance on a perfectly separable synthetic dataset should give roc_auc == 1.0
- compute_performance on random 50/50 predictions should give roc_auc ≈ 0.5 (assert within tolerance)
- compute_fairness: construct a synthetic case with an obvious demographic parity violation and assert the metric is above a threshold
- expected_calibration_error: a perfectly calibrated synthetic case (y_prob == true empirical rate per bin) should give ECE ≈ 0; a badly miscalibrated one should give high ECE
- build_validation_report: table-driven test with 3 cases (both pass, perf fail, fairness fail) asserting passed_hard_constraints matches expectation
```

### Tests (Phase 5)
- [ ] AUC == 1.0 on separable data, ≈0.5 on random
- [ ] Fairness metric correctly flags an engineered disparity
- [ ] ECE ≈ 0 on calibrated synthetic data, high on miscalibrated
- [ ] `build_validation_report` table-driven test (3+ cases) passes

---

## Phase 6 — Governance Policy Engine

**Goal:** Deterministic, auditable rule evaluation — the layer the LLM agent is not allowed to override.

**Files:** `src/governance/policy_engine.py`, `src/governance/evidence.py`, `src/governance/rules/credit_policy.yaml`.

### Prompt
```
Phase 6 of Arbiter: implement the governance policy engine, per PROJECT.md §5.18–5.19.

1. src/governance/rules/credit_policy.yaml — define min_auc: 0.75, max_dpd: 0.1, max_ece: 0.05, and a min_sample_size: 500 rule.
2. src/governance/policy_engine.py — load_policy(path) and evaluate_policy(report: ValidationReport, policy: dict) -> Literal["pass","fail","review"]. Logic: any hard-constraint violation (AUC below min, or sample size too small) -> "fail"; borderline fairness or calibration violation (over threshold but not egregiously, define "egregious" as 2x the threshold) -> "review"; otherwise -> "pass". Document the exact thresholds in a docstring.
3. src/governance/evidence.py — EvidenceBundle pydantic model (validation: ValidationReport, drift: DriftReport, policy_verdict: str, compiled_at: datetime) and compile_evidence(validation, drift, verdict).

Write tests/test_policy_engine.py:
- load_policy loads the real YAML file and asserts keys exist
- evaluate_policy: table-driven test with at least 5 cases spanning pass/fail/review, including one exactly-at-threshold boundary case (decide and document whether boundary is inclusive)
- compile_evidence: assert the returned EvidenceBundle has all three fields populated and compiled_at is a recent datetime
```

### Tests (Phase 6)
- [ ] YAML policy loads with expected keys
- [ ] 5+ table-driven `evaluate_policy` cases pass, including a boundary case
- [ ] `compile_evidence` populates all fields with a recent timestamp

---

## Phase 7 — LangGraph Governance Agent

**Goal:** Stateful agent that inspects evidence, reasons over it via Groq, and outputs a decision + written rationale.

**Files:** `src/agent/state.py`, `src/agent/nodes.py`, `src/agent/graph.py`, `src/agent/prompts.py`.

### Prompt
```
Phase 7 of Arbiter: implement the LangGraph agent, per PROJECT.md §5.20–5.23.

1. src/agent/state.py — ArbiterState TypedDict (evidence: EvidenceBundle, reasoning_trace: list[str], decision: NotRequired[Literal["promote","reject","human_review"]], rationale: NotRequired[str]).
2. src/agent/prompts.py — RATIONALE_PROMPT template and format_rationale_prompt(evidence).
3. src/agent/nodes.py — inspect_node (appends a summary line to reasoning_trace), reasoning_node (calls langchain_groq.ChatGroq with format_rationale_prompt(evidence), stores the response text as state["rationale"]), decision_node (maps evidence.policy_verdict -> decision exactly as in PROJECT.md §5.21).
4. src/agent/graph.py — build_arbiter_graph() wiring inspect -> reason -> decide -> END exactly as in PROJECT.md §5.22.

Write tests/test_agent_graph.py:
- decision_node: table-driven test mapping "pass"->"promote", "fail"->"reject", "review"->"human_review", using a fixture EvidenceBundle with each verdict
- reasoning_node: mock ChatGroq entirely (do not call the real Groq API in tests) and assert state["rationale"] is set to the mocked response content
- build_arbiter_graph: run the full compiled graph end-to-end with a mocked LLM and a "pass"-verdict EvidenceBundle fixture, asserting final state["decision"] == "promote" and reasoning_trace has at least 1 entry

Make sure ChatGroq is imported in a way that's easy to patch with unittest.mock.patch (e.g. import the class, not a pre-instantiated singleton, inside reasoning_node's module namespace).
```

### Tests (Phase 7)
- [ ] `decision_node` truth table (3 cases) passes
- [ ] `reasoning_node` works with mocked LLM, no real API call in CI
- [ ] Full graph run (mocked LLM) produces correct end-to-end decision
- [ ] `reasoning_trace` is non-empty after a full run

---

## Phase 8 — FastAPI Serving Layer

**Goal:** Async `/predict`, `/explain`, `/health` endpoints backed by the Feast online store and a loaded MLflow model.

**Files:** `src/serving/main.py`, `src/serving/routes/predict.py`, `src/serving/routes/explain.py`, `src/serving/routes/health.py`, `src/serving/explainer.py`, `src/serving/schemas.py`.

### Prompt
```
Phase 8 of Arbiter: implement the serving layer, per PROJECT.md §5.24–5.29.

1. src/serving/schemas.py — PredictRequest, PredictResponse, ExplainResponse pydantic models.
2. src/serving/explainer.py — build_explainer(model) returning a shap.TreeExplainer.
3. src/serving/routes/health.py — GET /health returning {"status": "ok"}.
4. src/serving/routes/predict.py — POST /predict: awaits get_online_features, runs model.predict_proba, returns PredictResponse. Wrap the feature fetch and model inference so they could run concurrently with asyncio.gather if a second async I/O step existed (add a code comment showing where SHAP explanation would be gathered concurrently in Phase 8b if both were needed on one call).
5. src/serving/routes/explain.py — POST /explain using the cached TreeExplainer from app.state.
6. src/serving/main.py — FastAPI app, startup event loading the Production-stage model from MLflow and building the explainer, mounts all three routers.

Write tests/test_serving.py using FastAPI's TestClient:
- GET /health returns 200 and {"status":"ok"}
- POST /predict with a mocked app.state.model and a mocked get_online_features returns a PredictResponse with risk_score between 0 and 1
- POST /explain with a mocked explainer returns shap_values as a list of floats matching the number of input features
- test a malformed request body (missing applicant_id) returns a 422 validation error

Use FastAPI dependency overrides or monkeypatching to avoid hitting real MLflow/Feast/Redis in tests.
```

### Tests (Phase 8)
- [ ] `/health` returns 200
- [ ] `/predict` returns a valid risk_score in [0,1] with mocked deps
- [ ] `/explain` returns SHAP values of the correct length
- [ ] Malformed request returns 422
- [ ] No test makes a real network call to MLflow/Feast/Redis

---

## Phase 9 — Deployment: Kubernetes + Argo Rollouts

**Goal:** Staged rollout (staging → shadow → canary → production) driven by code, with automated rollback.

**Files:** `src/deployment/promoter.py`, `src/deployment/rollback.py`, `k8s/base/*.yaml`, `k8s/rollout/canary-rollout.yaml`.

### Prompt
```
Phase 9 of Arbiter: implement deployment orchestration, per PROJECT.md §5.30–5.31 and the k8s/ directory.

1. src/deployment/promoter.py — promote_to_staging(model_name, version) (calls registry.transition_stage(..., "Staging")) and start_canary(model_name, version) (shells out to kubectl argo rollouts set image, per the PROJECT.md snippet).
2. src/deployment/rollback.py — rollback_to_last_stable() shelling out to kubectl argo rollouts undo.
3. k8s/base/api-deployment.yaml — a Deployment for the FastAPI serving image with resource requests/limits, readiness probe hitting /health, and 2 replicas minimum.
4. k8s/base/api-hpa.yaml — HorizontalPodAutoscaler targeting 70% CPU, min 2 / max 10 replicas.
5. k8s/base/worker-deployment.yaml — Deployment for the Prefect worker.
6. k8s/base/service.yaml — ClusterIP Service exposing the API deployment on port 80 -> 8000.
7. k8s/rollout/canary-rollout.yaml — an Argo Rollouts `Rollout` CR (not a plain Deployment) with canary steps: setWeight 5, pause, setWeight 25, pause, setWeight 100, and an analysis template reference for automated rollback on error rate.

Write tests/test_deployment.py:
- promote_to_staging: mock registry.transition_stage and assert it's called with stage="Staging"
- start_canary: mock subprocess.run and assert the exact kubectl argo rollouts command is constructed correctly with the given model_name and version interpolated
- rollback_to_last_stable: mock subprocess.run and assert the undo command is called

All subprocess calls must be mocked in tests — do not require a real cluster to run the test suite. Separately, write a short README section (append to PROJECT.md §8) on how to validate the YAML manifests locally with `kubectl apply --dry-run=client -k k8s/base` and `kubeval` or `kubeconform`.
```

### Tests (Phase 9)
- [ ] `promote_to_staging` calls registry with correct stage (mocked)
- [ ] `start_canary` constructs the exact expected subprocess command (mocked)
- [ ] `rollback_to_last_stable` triggers `argo rollouts undo` (mocked)
- [ ] `kubectl apply --dry-run=client -k k8s/base` validates cleanly
- [ ] Rollout CR YAML is valid per `kubeconform` (or equivalent schema check)

---

## Phase 10 — Monitoring & Immutable Audit Log

**Goal:** Live metrics exported to Prometheus, incident-triggered rollback, every governance decision written immutably.

**Files:** `src/monitoring/metrics.py`, `src/monitoring/incident.py`, `src/audit/logger.py`.

### Prompt
```
Phase 10 of Arbiter: implement monitoring and audit logging, per PROJECT.md §5.32–5.34.

1. src/monitoring/metrics.py — PREDICTION_LATENCY (Histogram) and PREDICTION_SCORE (a Summary or Histogram) prometheus_client metrics, plus record_prediction(latency_s, score). Also add a /metrics route (prometheus_client's generate_latest) and wire it into src/serving/main.py.
2. src/monitoring/incident.py — handle_alert(alert_payload: dict) that inspects a Prometheus Alertmanager webhook-style payload and calls rollback_to_last_stable() when alertname == "HighErrorRate" or "FairnessDrift".
3. src/audit/logger.py — log_decision(evidence, decision, rationale) writing an insert to a Supabase `audit_log` table, per the PROJECT.md snippet, using the Settings from config.py rather than hardcoded credentials.

Write tests/test_monitoring_audit.py:
- record_prediction: assert the Histogram's sample count increases by 1 after a call (use the prometheus_client REGISTRY to inspect samples, or mock the Histogram)
- handle_alert: table-driven test — "HighErrorRate" and "FairnessDrift" both trigger a (mocked) rollback_to_last_stable call; an unrelated alertname does not
- log_decision: mock supabase.create_client and assert .table("audit_log").insert(...) is called with a dict containing "decision" and "rationale" keys matching the input
```

### Tests (Phase 10)
- [ ] Prometheus histogram sample count increments correctly
- [ ] `handle_alert` triggers rollback only on relevant alert names (mocked)
- [ ] `log_decision` inserts the correct payload shape into Supabase (mocked)

---

## Phase 11 — Prefect Orchestration (Full Pipeline Wiring)

**Goal:** One flow that chains every previous phase end-to-end: ingest → validate → snapshot → drift check → retrain (if triggered) → validate model → policy → agent → deploy/reject → audit log.

**Files:** `src/orchestration/flows.py`.

### Prompt
```
Phase 11 of Arbiter: wire the full pipeline into one Prefect flow, per PROJECT.md §5.35, now that Phases 1-10 exist.

Implement src/orchestration/flows.py with:
1. A @task-wrapped function for each pipeline stage, reusing (not reimplementing) the functions built in prior phases: ingest_task, validate_task, snapshot_task, drift_check_task, retrain_task, register_task, validate_model_task, policy_task, agent_task, deploy_or_reject_task, audit_task.
2. A single @flow governance_pipeline(dataset_path: str) -> None that:
   - loads and validates data; quarantines and short-circuits (return early) on validation failure
   - snapshots the validated dataset
   - checks drift against a stored reference; only proceeds to retraining if is_persistent_drift() is True OR a force_retrain: bool = False flow parameter is set
   - if retraining fires: build splits, train candidate, register in MLflow, run validation engine, evaluate policy, compile evidence, run the agent graph
   - branches on agent decision: "promote" -> promote_to_staging + start_canary, "reject" -> archive registry stage, "human_review" -> leave in Staging and log for manual review
   - always calls log_decision at the end when an agent decision was reached
3. Add Prefect retries (retries=2, retry_delay_seconds=30) on the ingest_task and drift_check_task specifically (network/IO-prone steps).

Write tests/test_orchestration.py:
- test that governance_pipeline short-circuits (does not call snapshot_task) when validate_task fails — mock every task function and assert call order/absence using unittest.mock
- test the full happy path: mock every task so agent_task returns a "promote" decision, and assert promote_to_staging and start_canary are both called, and audit_task/log_decision is called exactly once
- test the "reject" branch calls the archive path and does NOT call start_canary
- run these as Prefect flow tests using prefect's testing harness (`prefect.testing.utilities.prefect_test_harness` fixture) so no real Prefect server/API is required
```

### Tests (Phase 11)
- [ ] Pipeline short-circuits correctly on validation failure
- [ ] Happy path (promote) calls the right deployment functions exactly once
- [ ] Reject path does not call canary/promotion functions
- [ ] All tests run via `prefect_test_harness` with zero external Prefect server dependency

---

## Phase 12 — CI/CD Completion

**Goal:** Full pipeline: lint → typecheck → test → build → push → deploy on tag.

**Files:** `.github/workflows/ci.yml` (extend), `.github/workflows/cd.yml` (new).

### Prompt
```
Phase 12 of Arbiter: complete the CI/CD pipeline.

1. Extend .github/workflows/ci.yml to add a "build" job (after test passes) that builds Dockerfile.api and Dockerfile.worker and pushes both to ghcr.io tagged with the git SHA, gated on the workflow running on the main branch.
2. Create .github/workflows/cd.yml triggered on tag push (v*.*.*) that:
   - checks out the repo
   - authenticates to the target Kubernetes cluster (use a placeholder KUBE_CONFIG secret)
   - runs `kubectl apply -k k8s/base`
   - runs `kubectl argo rollouts set image credit-model-rollout api=ghcr.io/<org>/arbiter-api:${{ github.ref_name }}`
   - waits for rollout health with `kubectl argo rollouts status credit-model-rollout --watch --timeout 600s`, failing the job if the rollout doesn't stabilize

Do not write real secrets — use GitHub Actions `secrets.*` placeholders and document in a comment which secrets must be configured (KUBE_CONFIG, GHCR_TOKEN).
```

### Tests (Phase 12)
- [ ] `act` (local GitHub Actions runner) or a dry run confirms YAML syntax is valid
- [ ] CI job graph is lint → typecheck → test → build, with build gated on branch == main
- [ ] CD workflow triggers only on semver tags

---

## Phase 13 — Governance Dashboard (Next.js)

**Goal:** A read-only-first dashboard showing model cards, drift trends, fairness trends, and the decision/audit log, reading from Supabase.

**Files:** `dashboard/` (separate Next.js app).

### Prompt
```
Phase 13 of Arbiter: scaffold the governance dashboard as a separate Next.js 14 (App Router) app in dashboard/.

1. Set up Supabase client (@supabase/supabase-js) reading NEXT_PUBLIC_SUPABASE_URL / ANON_KEY from env.
2. Build pages: /decisions (table of audit_log rows: model, decision, rationale, timestamp), /models (MLflow model cards — fetched via a small Next.js API route that proxies MLflow's REST API), /drift (line chart of dataset_drift over time per model, using recharts).
3. Use Supabase Realtime subscriptions on the audit_log table so /decisions updates live without a manual refresh.
4. Keep styling minimal (Tailwind), prioritize correctness over visual polish for this phase.

Write a small set of component tests with @testing-library/react + vitest:
- the decisions table renders one row per audit_log entry from a mocked Supabase response
- a "review" decision renders with a visually distinct badge/style from "promote"/"reject"
- the drift chart component renders without crashing given an empty dataset (edge case)
```

### Tests (Phase 13)
- [ ] Decisions table renders correctly from mocked data
- [ ] Decision-type badges render distinct styles
- [ ] Drift chart handles empty data without crashing
- [ ] `npm run build` succeeds

---

## Master Checklist (all phases)

| Phase | Component | Status |
|---|---|---|
| 0 | Scaffolding | ☐ |
| 1 | Data ingestion/validation/versioning | ☐ |
| 2 | Feature store (Feast) | ☐ |
| 3 | Drift detection | ☐ |
| 4 | Training + MLflow registry | ☐ |
| 5 | Validation engine | ☐ |
| 6 | Policy engine | ☐ |
| 7 | LangGraph agent | ☐ |
| 8 | FastAPI serving | ☐ |
| 9 | K8s + Argo Rollouts | ☐ |
| 10 | Monitoring + audit log | ☐ |
| 11 | Prefect orchestration | ☐ |
| 12 | CI/CD | ☐ |
| 13 | Dashboard | ☐ |

---

## One combined "give this whole plan to Claude" prompt

If you'd rather hand the agent the entire roadmap at once and have it work phase-by-phase autonomously (pausing for your review between phases), use this:

```
I'm building "Arbiter," an agentic credit-risk MLOps governance platform. I've attached two files: PROJECT.md (full architecture, tech stack, and file-by-file spec) and BUILD_PHASES.md (a 13-phase build plan with a prompt and test checklist per phase).

Work through the phases in BUILD_PHASES.md in strict order, one phase at a time:
1. Before starting a phase, restate which phase you're on and its goal in one sentence.
2. Implement exactly what that phase's prompt specifies — reference the matching section of PROJECT.md for exact function signatures, and expand the snippets into full production code (type hints, docstrings, logging, error handling).
3. Write the tests specified in that phase's prompt in the same turn.
4. Run the tests yourself if you have execution access; report pass/fail. If any test fails, fix the implementation before moving on — do not skip ahead with failing tests.
5. After a phase's tests pass, print the phase's "Tests" checklist from BUILD_PHASES.md with each item marked done, then stop and wait for my go-ahead before starting the next phase.
6. Never implement a future phase's logic early, even if it seems convenient — keep each phase's diff scoped to its own files.
7. If PROJECT.md and a phase prompt ever conflict, PROJECT.md's file-by-file blueprint wins; flag the conflict to me rather than silently picking one.

Start with Phase 0 now.
```
