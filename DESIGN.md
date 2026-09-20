# DESIGN.md — Phase 13: Governance Dashboard (Next.js)

> **Status:** Design only — no code yet. Build after approval.

---

## 1. What This Is

A **read-only-first** web dashboard that gives governance reviewers a single pane of glass into every model decision, drift trend, fairness metric, and audit trail entry. It reads from Supabase (audit log + drift snapshots) and MLflow (model registry) via Next.js API routes.

This is **not** a model training UI or an admin panel. It answers three questions:

1. **What decisions has the system made?** → `/decisions`
2. **What models are registered and which is in production?** → `/models`
3. **Is the model drifting or becoming unfair?** → `/drift`

---

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | SSR for fast initial load, API routes for backend proxy, Vercel-ready |
| Styling | Tailwind CSS | Utility-first, no component library needed for read-only views |
| Charts | Recharts | Lightweight, React-native, no D3 overhead |
| Database client | @supabase/supabase-js | Realtime subscriptions, type-safe queries |
| Testing | Vitest + @testing-library/react | Fast, React-native testing |
| Deployment | Vercel (or `next start` in Docker) | Zero-config SSR hosting |

---

## 3. Directory Structure

```
dashboard/
├── app/
│   ├── layout.tsx              # Root layout: sidebar nav + Tailwind
│   ├── page.tsx                # Redirects to /decisions
│   ├── decisions/
│   │   └── page.tsx            # Audit log table with realtime updates
│   ├── models/
│   │   └── page.tsx            # MLflow model cards
│   ├── drift/
│   │   └── page.tsx            # Drift + fairness trend charts
│   └── api/
│       ├── models/
│       │   └── route.ts        # Proxies MLflow Model Registry REST API
│       └── health/
│           └── route.ts        # Simple health check for uptime monitors
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── DecisionBadge.tsx       # Colored badge: promote / reject / review
│   ├── DecisionsTable.tsx      # Paginated table of audit_log rows
│   ├── ModelCard.tsx           # Single model version card
│   ├── DriftChart.tsx          # Line chart of drift score over time
│   ├── FairnessChart.tsx       # Bar chart of DPD/EOD per model
│   └── EmptyState.tsx          # Placeholder when no data exists
├── lib/
│   ├── supabase.ts             # Supabase client singleton
│   └── mlflow.ts               # MLflow REST helpers
├── __tests__/
│   ├── decisions.test.tsx      # DecisionsTable renders from mock data
│   ├── decision-badge.test.tsx # Badge styles per decision type
│   ├── drift-chart.test.tsx    # Chart handles empty dataset
│   └── model-card.test.tsx     # ModelCard renders version info
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── .env.local.example
```

---

## 4. Pages — Detailed Design

### 4.1 `/decisions` — Audit Log

**Purpose:** Live-updating table of every governance decision the Arbiter agent has made.

**Data source:** Supabase `audit_log` table (append-only).

**Schema of `audit_log` table:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `model_name` | text | Registered model name (e.g. `credit_champion`) |
| `model_version` | int | MLflow model version number |
| `decision` | text | One of: `promote`, `reject`, `human_review` |
| `rationale` | text | Plain-English explanation from the LLM agent |
| `evidence` | jsonb | Full evidence bundle (validation report, drift report, policy verdict) |
| `created_at` | timestamptz | UTC timestamp, indexed |

**Component: `DecisionsTable`**

```
┌──────┬───────────────┬─────────┬────────────────────┬───────────────────────┐
│ Time │ Model         │ Version │ Decision           │ Rationale             │
├──────┼───────────────┼─────────┼────────────────────┼───────────────────────┤
│ ...  │ credit_champion│   3    │ ✅ promote (green) │ "Model exceeded AUC…" │
│ ...  │ credit_champion│   4    │ 🚫 reject (red)   │ "DPD exceeded 0.10…"  │
│ ...  │ credit_champion│   5    │ ⚠️ review (amber) │ "Borderline calibr…"  │
└──────┴───────────────┴─────────┴────────────────────┴───────────────────────┘
```

**Realtime:** Supabase Realtime subscription on `audit_log` INSERT events. New rows appear instantly without page refresh. Implementation:

```typescript
// lib/supabase.ts
const channel = supabase
  .channel('audit-changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
    // Add new row to top of table state
  })
  .subscribe()
```

**Pagination:** Client-side pagination (50 rows per page) since the audit log is append-only and grows slowly (~10-100 rows/day in production).

**Empty state:** When no audit_log rows exist yet, show `EmptyState` component with a message: "No governance decisions recorded yet. Decisions appear here after the first model promotion cycle runs."

---

### 4.2 `/models` — Model Registry

**Purpose:** Show every registered model version, its stage, performance metrics, and which one is currently serving production traffic.

**Data source:** MLflow Model Registry REST API, proxied through a Next.js API route (to avoid exposing the MLflow server URL to the browser).

**Next.js API route: `/api/models`**

- `GET /api/models` → calls `GET {MLFLOW_URL}/api/2.0/mlflow/registered-models/search`
- Returns: list of registered models with their versions, stages, metrics, and run links
- Caches response for 30 seconds (model registry changes infrequently)

**Component: `ModelCard`**

```
┌─────────────────────────────────────────────┐
│ credit_champion                     v3 🟢   │  ← green dot = Production
│                                              │
│ Stage: Production                            │
│ AUC: 0.823  |  Gini: 0.646  |  ECE: 0.031  │
│ Trained: 2024-06-15  |  Run: abc123         │
│                                              │
│ [View in MLflow →]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ credit_champion                     v2 ⚪   │  ← gray = Archived
│                                              │
│ Stage: Archived                              │
│ AUC: 0.798  |  Gini: 0.596  |  ECE: 0.048  │
│ Trained: 2024-05-20  |  Run: def456         │
└─────────────────────────────────────────────┘
```

**Stage badge colors:**

| Stage | Color | Badge |
|-------|-------|-------|
| Production | Green | 🟢 |
| Staging | Blue | 🔵 |
| Archived | Gray | ⚪ |
| None | Light gray | — |

---

### 4.3 `/drift` — Drift & Fairness Trends

**Purpose:** Time-series visualization of model drift and fairness metrics so reviewers can spot degradation trends before they become incidents.

**Data source:** Supabase `drift_snapshots` table (populated by the Prefect orchestration flow after each drift check).

**Schema of `drift_snapshots` table:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `model_name` | text | Which model was checked |
| `dataset_drift` | boolean | Overall drift verdict |
| `drifted_features` | jsonb | Array of feature names that drifted |
| `demographic_parity_diff` | float | DPD from the latest fairness check |
| `equalized_odds_diff` | float | EOD from the latest fairness check |
| `roc_auc` | float | Latest AUC |
| `created_at` | timestamptz | UTC timestamp, indexed |

**Charts:**

1. **Drift Score Over Time** (`DriftChart`)
   - Line chart with X-axis = time, Y-axis = number of drifted features
   - A horizontal red line at `max_dpd` threshold (0.10) shows the fairness boundary
   - Empty state: flat line with "No drift data yet" message

2. **Fairness Metrics Over Time** (`FairnessChart`)
   - Grouped bar chart: DPD and EOD side by side per snapshot
   - Red threshold line at ±0.10 for DPD
   - Handles empty data gracefully (renders axes but no bars)

**Empty state for both charts:** The `DriftChart` and `FairnessChart` components accept an empty array and render chart axes with a centered "Awaiting drift data — charts populate after the first governance pipeline run" message.

---

## 5. Shared Components

### 5.1 `Sidebar.tsx`

Horizontal top bar or vertical sidebar (responsive — sidebar on desktop, hamburger on mobile):

```
┌──────────────────────────────────────────────────────┐
│ 🏛️ Arbiter    Decisions    Models    Drift          │
└──────────────────────────────────────────────────────┘
```

Active page is highlighted. Simple `<Link>` navigation — no client-side routing library needed.

### 5.2 `DecisionBadge.tsx`

Props: `decision: "promote" | "reject" | "human_review"`

| Decision | Background | Text | Icon |
|----------|-----------|------|------|
| `promote` | `bg-emerald-100` | `text-emerald-800` | ✅ |
| `reject` | `bg-red-100` | `text-red-800` | 🚫 |
| `human_review` | `bg-amber-100` | `text-amber-800` | ⚠️ |

### 5.3 `EmptyState.tsx`

Props: `title: string`, `description: string`

Centered card with muted icon, title text, and description. Used on all three pages when data doesn't exist yet.

---

## 6. Environment Variables

```env
# Supabase (audit log + drift snapshots)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# MLflow (model registry — server-side only, NOT exposed to browser)
MLFLOW_TRACKING_URI=http://localhost:5000
```

- `NEXT_PUBLIC_*` vars are bundled into client JS (safe — anon key is public by design)
- `MLFLOW_TRACKING_URI` is server-side only (used in API routes, never leaked to browser)

---

## 7. Data Flow Diagram

```
Browser
  │
  ├── GET /decisions ──────────→ Supabase (audit_log, Realtime subscription)
  ├── GET /models ─────────────→ /api/models route ──→ MLflow REST API
  ├── GET /drift ──────────────→ Supabase (drift_snapshots)
  └── Realtime channel ────────→ Supabase Realtime (INSERT on audit_log)
```

---

## 8. Testing Strategy

| Test | What it validates | Approach |
|------|-------------------|----------|
| `decisions.test.tsx` | DecisionsTable renders one row per audit_log entry | Mock Supabase response, assert row count + content |
| `decision-badge.test.tsx` | Badge renders correct color per decision type | Render with each decision value, assert CSS classes |
| `drift-chart.test.tsx` | DriftChart handles empty array without crashing | Render with `[]`, assert no errors + empty state message |
| `model-card.test.tsx` | ModelCard shows version, stage, metrics | Mock model data, assert text content |

All tests run in Vitest with jsdom environment. No real Supabase or MLflow connections.

---

## 9. Build Order

| Step | What | Estimated effort |
|------|------|-----------------|
| 1 | Scaffold Next.js app + Tailwind + Vitest | 10 min |
| 2 | Supabase client + MLflow helpers | 10 min |
| 3 | Sidebar + layout | 10 min |
| 4 | `/decisions` page + DecisionsTable + DecisionBadge + realtime | 20 min |
| 5 | `/models` page + /api/models route + ModelCard | 15 min |
| 6 | `/drift` page + DriftChart + FairnessChart | 20 min |
| 7 | EmptyState + responsive polish | 10 min |
| 8 | Component tests | 15 min |
| 9 | `npm run build` verification | 5 min |

**Total estimated time:** ~2 hours

---

## 10. What This Is NOT

- **Not a model training UI** — training happens in the Prefect pipeline
- **Not an admin panel** — no user management, no role-based access
- **Not a real-time prediction monitor** — that's Grafana + Prometheus
- **Not a configuration UI** — policy rules live in YAML, edited in code

This is a **governance review interface** — read-only, audit-focused, designed for compliance reviewers who need to answer "why did the system approve this model?" without reading logs.
