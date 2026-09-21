# DESIGN.md — Phase 13: Governance Dashboard (Next.js)

> **Status:** Approved — ready to build.

---

## 1. What This Is

A **read-only-first** web dashboard that gives governance reviewers a single pane of glass into every model decision, drift trend, fairness metric, and audit trail entry. It reads from Supabase (audit log) and MLflow (model registry) via Next.js API routes.

Two switchable views:
1. **Telemetry View** — Cyber aesthetic, charts, dynamic indicators, dark-first
2. **Auditor View** — High-density tables, filters, JSON drawers, compliance export

Three pages:
1. **Decisions** → audit log with realtime updates
2. **Models** → MLflow model cards with stage badges
3. **Drift** → drift + fairness trend charts

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS variables for theming |
| Charts | Recharts (client-only via `next/dynamic`, `ssr: false`) |
| Animations | Framer Motion (page transitions, hover, stagger) |
| Database | @supabase/supabase-js (Realtime + queries) |
| Testing | Vitest + @testing-library/react |
| Icons | Lucide React |

---

## 3. Critical Implementation Notes

### Recharts + Next.js SSR
Recharts depends on `window`. Every chart component MUST:
- Have `"use client"` directive
- Be imported with `next/dynamic({ ssr: false })`

### Supabase Realtime
Requires SQL migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
```

### MLflow API Proxy
The `/api/models` route makes 3 sequential calls:
1. `GET /api/2.0/mlflow/registered-models/search` → model names
2. `GET /api/2.0/mlflow/registered-models/get-latest-versions` → versions
3. `GET /api/2.0/mlflow/runs/get` → metrics per run

### Drift Data Source
Read from `audit_log.evidence` JSONB column — no separate `drift_snapshots` table needed. Each governance decision's evidence bundle contains the drift report.

---

## 4. Directory Structure

```
dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── decisions/page.tsx
│   ├── models/page.tsx
│   ├── drift/page.tsx
│   └── api/models/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ModeToggle.tsx
│   ├── decisions/
│   │   ├── DecisionsTable.tsx
│   │   ├── DecisionBadge.tsx
│   │   └── EvidenceDrawer.tsx
│   ├── models/
│   │   ├── ModelCard.tsx
│   │   └── ModelGrid.tsx
│   ├── drift/
│   │   ├── DriftChart.tsx
│   │   └── FairnessChart.tsx
│   ├── shared/
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ErrorState.tsx
│   └── ui/
│       ├── ThemeToggle.tsx
│       └── SearchInput.tsx
├── lib/
│   ├── supabase.ts
│   ├── mlflow.ts
│   ├── mock-data.ts
│   ├── theme-context.tsx
│   └── mode-context.tsx
├── __tests__/
│   ├── decisions.test.tsx
│   ├── decision-badge.test.tsx
│   ├── drift-chart.test.tsx
│   └── model-card.test.tsx
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── .env.local.example
```

---

## 5. Theming

Two independent dimensions:

### Theme (Light / Dark)
Controlled via CSS variables on `:root` / `[data-theme="dark"]`. Toggle in header.

### View Mode (Telemetry / Auditor)
Controlled via React context. Toggle in header.

| | Telemetry View | Auditor View |
|---|---|---|
| Background | Dark gradient, glassmorphism cards | Clean white/gray |
| Typography | Monospace accents, glowing text | Sans-serif, dense |
| Data display | Charts, animated indicators | Tables, filters, export |
| Interactions | Hover glow, stagger animations | Click-to-expand drawers |

---

## 6. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
MLFLOW_TRACKING_URI=http://localhost:5000
```
