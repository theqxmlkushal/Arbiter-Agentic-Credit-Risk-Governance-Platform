# Arbiter — Agentic Credit-Risk Governance Platform

An explainable credit-risk MLOps platform where model promotion is gated by an autonomous governance agent, not a human eyeballing a metrics dashboard.

Every retrain produces one or more candidate models. Before any candidate can reach production, a LangGraph-orchestrated agent evaluates its fairness metrics and drift behavior, generates a plain-English audit rationale via Groq, and either promotes it, rejects it, or flags it for human review — logging the decision immutably. This mirrors how banks (Goldman Sachs, JPMorgan, Morgan Stanley, Barclays) actually govern models in production under formal Model Risk Management frameworks.

Full technical blueprint, architecture rationale, and step-by-step build sequence: see [`PROJECT.md`](./PROJECT.md).

---

## Why this exists

Most "MLOps portfolio projects" stop at: train a model, wrap it in an API, add a Grafana dashboard. That proves you can deploy a model — it doesn't prove you can be trusted to deploy one in a regulated environment, where accuracy alone is never sufficient grounds for shipping.

Arbiter adds the layer that actually determines production-readiness in finance: **explainability, fairness auditing, and a governed, auditable promotion decision** — with an agent generating the rationale a compliance reviewer would otherwise have to write by hand.

## Features

- Baseline + two candidate models (logistic regression, XGBoost, LightGBM), tracked in MLflow
- SHAP-based explanations, both offline (per-model) and online (per-prediction via API)
- Fairness audit (Fairlearn) on every candidate before promotion is even considered
- Agentic governance layer (LangGraph + Groq) that auto-promotes, auto-rejects, or escalates to human review
- Immutable decision audit trail in Supabase
- FastAPI serving layer with `/predict`, `/explain`, `/health`
- Dockerized, with a GitHub Actions CI/CD pipeline covering lint, tests, and image builds
- Drift monitoring (Evidently AI) that can trigger retraining automatically
- Next.js dashboard (deployed on Vercel) visualizing model cards, fairness trends, and the decision log

## Tech stack

| Category | Tools |
|---|---|
| Data & versioning | DVC, GitHub |
| Experiment tracking | MLflow |
| Orchestration | GitHub Actions |
| Explainability | SHAP |
| Fairness | Fairlearn |
| Governance agent | LangGraph, Groq |
| Serving | FastAPI, Docker |
| Audit store | Supabase (Postgres) |
| Monitoring | Evidently AI |
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

Full setup, training pipeline, Docker, and dashboard instructions: [`PROJECT.md § 6`](./PROJECT.md#6-setup-and-run-instructions).

## Project structure

See [`PROJECT.md § 4`](./PROJECT.md#4-standardized-directory-structure) for the full annotated directory tree.

## Documentation

- [Model card](./docs/model_card.md)
- [Data card](./docs/data_card.md)
- [Responsible AI statement](./docs/responsible_ai_statement.md)

## License

MIT — see `LICENSE`.
