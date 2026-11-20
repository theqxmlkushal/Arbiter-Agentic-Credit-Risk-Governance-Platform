"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MOCK_DRIFT_SNAPSHOTS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  TrendingUp,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  ShieldCheck,
  Database,
} from "lucide-react";
import { getMetricStatus, getStatusColor } from "@/lib/ui-helpers";

const DriftChart = dynamic(() => import("@/components/drift/DriftChart").then((m) => m.DriftChart), {
  ssr: false,
  loading: () => <LoadingSkeleton rows={6} />,
});

const FairnessChart = dynamic(() => import("@/components/drift/FairnessChart").then((m) => m.FairnessChart), {
  ssr: false,
  loading: () => <LoadingSkeleton rows={6} />,
});

export default function DriftPage() {
  const { mode } = useMode();
  const latest = MOCK_DRIFT_SNAPSHOTS[0];

  return (
    <div className="space-y-8">
      {/* Page Header (32px - 36px title, muted subtitle with text-balance) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
            >
              Continuous Surveillance
            </span>
            <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Monitoring Active
            </span>
          </div>
          <h1
            className="text-[32px] lg:text-[36px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Drift & Fairness
          </h1>
          <p className="text-[15px] mt-1.5 max-w-2xl leading-relaxed text-balance" style={{ color: "var(--text-muted)" }}>
            {mode === "telemetry"
              ? "Real-time surveillance of data distribution shifts, feature drift, and demographic parity across inference batches."
              : `Latest check: ${latest ? new Date(latest.created_at).toLocaleDateString() : "N/A"}. Dataset drift: ${latest?.dataset_drift ? "Detected" : "None"}.`}
          </p>
        </div>

        {/* Status Badge (max-w-xs, no overflow) */}
        <div
          className="hidden lg:flex items-center gap-3 p-4 rounded-2xl border max-w-xs shrink-0 overflow-hidden"
          style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
        >
          <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
          <div className="text-xs min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              Disparate Impact Guard
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              Four-Fifths Rule Active
            </p>
          </div>
        </div>
      </div>

      {/* Metric KPI Cards — grid-cols-2 xl:grid-cols-4 gap-4, p-5, colored via getMetricStatus */}
      {latest && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {(() => {
            const dpdStatus = getMetricStatus("parity", latest.demographic_parity_diff);
            const eodStatus = getMetricStatus("parity", latest.equalized_odds_diff);
            const aucStatus = getMetricStatus("auc", latest.roc_auc);
            const driftOk = latest.num_drifted === 0;

            const dpdSc = getStatusColor(dpdStatus);
            const eodSc = getStatusColor(eodStatus);
            const aucSc = getStatusColor(aucStatus);

            return [
              {
                label: "Drifted Features",
                value: latest.num_drifted,
                sub: latest.num_drifted === 0 ? "All distributions stable" : `${latest.num_drifted} features shifted`,
                icon: TrendingUp,
                sc: driftOk ? getStatusColor("pass") : getStatusColor("fail"),
                statusIcon: driftOk ? CheckCircle2 : AlertTriangle,
              },
              {
                label: "Demographic Parity Diff",
                value: latest.demographic_parity_diff.toFixed(4),
                sub: "Threshold ≤ 0.1000",
                icon: Shield,
                sc: dpdSc,
                statusIcon: dpdStatus === "pass" ? CheckCircle2 : dpdStatus === "warn" ? AlertTriangle : XCircle,
              },
              {
                label: "Equalized Odds Diff",
                value: latest.equalized_odds_diff.toFixed(4),
                sub: "Threshold ≤ 0.1000",
                icon: Sliders,
                sc: eodSc,
                statusIcon: eodStatus === "pass" ? CheckCircle2 : eodStatus === "warn" ? AlertTriangle : XCircle,
              },
              {
                label: "Production ROC-AUC",
                value: latest.roc_auc.toFixed(3),
                sub: "Minimum baseline: 0.750",
                icon: Activity,
                sc: aucSc,
                statusIcon: aucStatus === "pass" ? CheckCircle2 : aucStatus === "warn" ? AlertTriangle : XCircle,
              },
            ].map(({ label, value, sub, sc, statusIcon: StatusIcon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18 }}
                whileHover={{ y: -3 }}
                className="rounded-2xl p-5 border glass-card transition-all duration-150 flex flex-col justify-between"
                style={{
                  background: "var(--card-bg)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs"
                    style={{
                      background: sc.bg,
                      borderColor: sc.border,
                      color: sc.color,
                    }}
                  >
                    <StatusIcon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <span
                    className="text-3xl font-bold font-mono tracking-tight"
                    style={{ color: sc.color }}
                  >
                    {value}
                  </span>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {sub}
                  </p>
                </div>
              </motion.div>
            ));
          })()}
        </div>
      )}

      {/* Chart Panels: p-5, title + description with mb-4, 320px chart height, gap-5 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {[
          {
            title: "Drifted Features Over Time",
            description: "Number of features deviating from reference training distributions (oldest to newest)",
            Component: DriftChart,
            delay: 0.15,
          },
          {
            title: "Fairness Metrics Over Time",
            description: "Demographic parity & equalized odds disparities vs 0.10 regulatory bound",
            Component: FairnessChart,
            delay: 0.2,
          },
        ].map(({ title, description, Component, delay }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.18 }}
            className="rounded-2xl p-5 border glass-card"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="mb-4">
              <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {title}
              </h2>
              <p className="text-xs mt-0.5 text-balance" style={{ color: "var(--text-muted)" }}>
                {description}
              </p>
            </div>
            <div className="w-full">
              <ErrorBoundary fallbackTitle={`Error loading ${title}`}>
                <Component snapshots={MOCK_DRIFT_SNAPSHOTS} />
              </ErrorBoundary>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Balanced layout below charts: grid-cols-1 lg:grid-cols-3 gap-5, mt-6, pb-10 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6 pb-10">
        {/* Card 1: Distribution Drift Diagnostics */}
        <div
          className="rounded-2xl p-5 border glass-card space-y-3"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ background: "var(--accent-muted)", borderColor: "var(--border-color)", color: "var(--accent)" }}
            >
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Distribution Diagnostics
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Two-sample Kolmogorov-Smirnov and Population Stability Index (PSI) surveillance on high-cardinality features.
          </p>
          <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Dataset Drift Status:</span>
              <span
                className="font-semibold px-2 py-0.5 rounded text-[11px]"
                style={{
                  background: latest?.dataset_drift ? "var(--badge-reject-bg)" : "var(--badge-promote-bg)",
                  color: latest?.dataset_drift ? "var(--color-danger)" : "var(--color-success)",
                }}
              >
                {latest?.dataset_drift ? "Drift Flagged" : "Baseline Stable"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Drifted Attributes:</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                {latest?.drifted_features.length ?? 0} features
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Regulatory Parity Summary */}
        <div
          className="rounded-2xl p-5 border glass-card space-y-3"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ background: "var(--color-success-bg)", borderColor: "var(--color-success-border)", color: "var(--color-success)" }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Regulatory Compliance
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Four-Fifths Rule compliance and Equal Credit Opportunity Act (ECOA) automated disparate impact verification.
          </p>
          <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>DPD Bound (≤ 0.10):</span>
              <span className="font-mono font-semibold text-emerald-500">
                {latest ? `${latest.demographic_parity_diff.toFixed(4)} (Pass)` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>EOD Bound (≤ 0.10):</span>
              <span className="font-mono font-semibold text-emerald-500">
                {latest ? `${latest.equalized_odds_diff.toFixed(4)} (Pass)` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Model Health & Surveillance Cadence */}
        <div
          className="rounded-2xl p-5 border glass-card space-y-3"
          style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{ background: "var(--color-info-bg)", borderColor: "var(--color-info-border)", color: "var(--color-info)" }}
            >
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Surveillance Cadence
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Continuous sliding window tracking against the production champion baseline with automatic alert webhooks.
          </p>
          <div className="pt-2 border-t space-y-2 text-xs" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Evaluation Window:</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                Bi-Weekly Batches
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Champion ROC-AUC:</span>
              <span className="font-mono font-semibold text-emerald-500">
                {latest ? latest.roc_auc.toFixed(3) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
