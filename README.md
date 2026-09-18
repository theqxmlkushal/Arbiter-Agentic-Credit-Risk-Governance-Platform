# Arbiter — Agentic Credit-Risk Governance Platform

*Architecture — Autonomous + Human-in-the-Loop Model Lifecycle Governance*

An explainable credit-risk MLOps platform where model promotion is gated by an autonomous governance agent, not a human eyeballing a metrics dashboard.

Every retrain produces one or more candidate models. Before any candidate can reach production, the **Arbiter Agent Orchestrator** collects evidence, reasons over policy rules, investigates anomalies, and routes each candidate down one of three verdicts — **Promote**, **Reject**, or **Human Review** — generating a plain-English, auditable governance rationale for every decision. This mirrors how banks (Goldman Sachs, JPMorgan, Morgan Stanley, Barclays) actually govern models in production under formal Model Risk Management frameworks.


## Why this exists

Most "MLOps portfolio projects" stop at: train a model, wrap it in an API, add a Grafana dashboard. That proves you can deploy a model — it doesn't prove you can be trusted to deploy one in a regulated environment, where accuracy alone is never sufficient grounds for shipping.

Arbiter adds the layer that actually determines production-readiness in finance: data governance, drift-aware retraining, fairness/calibration auditing, and a governed, auditable promotion decision — with an agent generating the rationale a compliance reviewer would otherwise have to write by hand.

## Architecture

Arbiter runs as a single cluster with one ingestion gateway, one central orchestrator, three parallel governance paths, a convergence/arbitration stage, and a progressive deployment engine — wrapped in two cross-cutting panels that run continuously.

```
DATA SOURCES ──HTTPS/TLS──▶ INGESTION GATEWAY ──▶ ARBITER AGENT ORCHESTRATOR
                                                            │
                    ┌───────────────────────────┬───────────────────────────┐
                    ▼                           ▼                           ▼
          DATA & HEALTH PATH           MODEL LIFECYCLE PATH        GOVERNANCE & POLICY PATH
          ─────────────────           ────────────────────        ──────────────────────
          Data Governance Engine      Retraining Engine            Governance Policy Engine
          (schema/quality → outlier   (dataset construction →      (performance & fairness
          & dup checks → quarantine   recency weighting/class      rules → hard constraints
          or version snapshot)        balance → leakage check      → pass/fail/review state)
                    │                 & split)                              │
                    ▼                           │                           ▼
          Drift & Data Health Engine            ▼                 Human Governance Review
          (baseline vs prod compare →  Model Training & Registry   (reviewer dashboard →
          feature/population drift →   (feature engineering →      metrics/policy eval →
          persistence & retrain        train candidate → package   manual approve/reject)
          trigger)                     artifacts & registry)
                                                 │
                                                 ▼
                                       Model Validation Engine
                                       (fairness & calibration →
                                       champion vs candidate
                                       benchmark → validation
                                       report)
                    └───────────────────────────┴───────────────────────────┘
                                                 ▼
                    VERIFY & GROUND GOVERNANCE RATIONALE
                    (synthesizes validation metrics, drift alerts & policy rules)
                                                 ▼
                    DEPLOYMENT ENGINE
                    Staging ▶ Shadow Deployment ▶ Canary (5%→25%→100%) ▶ Production Champion
                                                 ▼
              ┌────────────────────┬───────────────────────┬─────────────────────────┐
              ▼                    ▼                        ▼                          ▼
     Production Champion   Governance Audit Reports   Human Escalate /          Quarantined /
     Model                 (.pdf / .json)              Review Queue             Rejected Artifacts

   Cross-cutting, always-on:
   • CONTINUOUS MONITORING ENGINE — live prediction health & drift, incident detection + automated rollback
   • AUDIT & GOVERNANCE LOG — immutable model lineage, Arbiter decision & rationale logs
```

### The three governance paths

| Path | Engines | Role |
|---|---|---|
| **Data & Health** | Data Governance Engine → Drift & Data Health Engine | Gates bad data at ingestion; detects population/feature drift and decides whether a shift is transient noise or a genuine retrain trigger |
| **Model Lifecycle** | Retraining Engine → Model Training & Registry → Model Validation Engine | Builds leakage-checked training sets, trains and registers candidates, and benchmarks them against fairness, calibration, and the active champion |
| **Governance & Policy** | Governance Policy Engine → Human Governance Review | Evaluates performance/fairness rules and hard constraints; routes borderline cases to a reviewer dashboard for a manual approve/reject |

All three paths feed the **arbitration stage**, where evidence is synthesized and grounded into a single governance rationale before anything is allowed near the **Deployment Engine**.

### Core components (12)

1. **Data Ingestion & Gatekeeping** — multi-source pipeline (historical, live loans, labels, policies) with strict schema validation, null/type enforcement, and standard credit-feature definitions
2. **Validation & Quarantine Flow** — missing-value/out-of-range/dedup checks; fail → quarantine & alert, pass → versioned snapshot
3. **Drift Detection & Label Maturity** — baseline-vs-production distribution shift checks, temporal persistence logic (noise vs. real shift), and label-maturity verification before retraining fires
4. **Retraining Engine** — dataset construction, recency weighting, class balancing, leakage-checked train/val/test split
5. **Model Training & Registry** — feature engineering, candidate training, artifact packaging (model weights, fitted preprocessor, feature version, training config) with full lineage
6. **Multi-Vector Model Validation** — performance (ROC-AUC, Gini, PSI), fairness (disparate impact, demographic parity), calibration (ECE, calibration curves), robustness/stress testing, champion-vs-candidate significance testing, reproducibility (deterministic seed re-execution)
7. **Arbiter Agent Reasoning** — LangGraph-orchestrated agent collects validation evidence, investigates anomalies, and generates a formal, auditable governance rationale
8. **Decision Routing** — **Promote** (safe + policy pass), **Human Review** (uncertain/borderline), **Reject** (unsafe/hard constraint fail)
9. **Progressive Deployment** — staging validation → shadow production traffic → canary rollout (5% → 25% → 100%) → production champion
10. **Incident & Rollback Loop** — continuous monitoring of live predictions, infra metrics, business impact, and fairness; automated immediate rollback to the last stable champion + retraining trigger on critical incident
11. **Immutable Audit Trail** — full lifecycle provenance: data version/snapshot hash → validation report → metrics & bias log → Arbiter rationale → human/rollback decision log, all signed
12. **Continuous Monitoring Engine** — live drift and prediction-health telemetry running in parallel with every other component

## Features

- Baseline + two candidate models (logistic regression, XGBoost, LightGBM), tracked in MLflow
- SHAP-based explanations, both offline (per-model) and online (per-prediction via API)
- Fairness audit (Fairlearn) and calibration checks on every candidate before promotion is considered
- Drift monitoring (Evidently AI) with baseline-vs-production comparison and persistence logic that can trigger retraining automatically
- Agentic governance layer (LangGraph + Groq) that auto-promotes, auto-rejects, or escalates to human review with a generated rationale
- Immutable decision + lineage audit trail in Supabase
- Progressive deployment: staging → shadow → canary (5%→25%→100%) → production champion
- Automated incident detection and rollback to the last stable champion
- FastAPI serving layer with `/predict`, `/explain`, `/health`
- Dockerized, with a GitHub Actions CI/CD pipeline covering lint, tests, and image builds
- Next.js dashboard (deployed on Vercel) visualizing model cards, fairness trends, drift, and the decision log

## Tech stack

| Category | Tools |
|---|---|
| Data & versioning | DVC, GitHub |
| Experiment tracking | MLflow |
| Orchestration | GitHub Actions |
| Agent orchestration | LangGraph |
| Explainability | SHAP |
| Fairness & calibration | Fairlearn |
| Governance/reasoning agent | LangGraph, Groq |
| Serving | FastAPI, Docker |
| Audit store | Supabase (Postgres) |
| Drift monitoring | Evidently AI |
| Dashboard | Next.js, Vercel |

## Quickstart

```bash
git clone https://github.com/<your-username>/arbiter-credit-governance.git
cd arbiter-credit-governance
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY
dvc pull
uvicorn src.serving.main:app --reload
```

Full setup, training pipeline, Docker, and dashboard instructions: `PROJECT.md` § 6.

## Project structure

See `PROJECT.md` § 4 for the full annotated directory tree.

## Documentation

- Model card
- Data card
- Responsible AI statement

## License

MIT — see `LICENSE`.