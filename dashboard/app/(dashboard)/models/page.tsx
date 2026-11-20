"use client";

import { motion } from "framer-motion";
import { ModelGrid } from "@/components/models/ModelGrid";
import { MOCK_MODELS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { Award, ShieldCheck } from "lucide-react";
import { getMetricStatus, getStatusColor } from "@/lib/ui-helpers";

export default function ModelsPage() {
  const { mode } = useMode();
  const production = MOCK_MODELS.find((m) => m.stage === "Production");

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
              MLflow Registry
            </span>
            <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Registry Synchronized
            </span>
          </div>
          <h1
            className="text-[32px] lg:text-[36px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Model Registry
          </h1>
          <p className="text-[15px] mt-1.5 max-w-2xl leading-relaxed text-balance" style={{ color: "var(--text-muted)" }}>
            {mode === "telemetry"
              ? "Comprehensive catalog of credit score cards, model lineages, calibration curves, and deployment stages."
              : `${MOCK_MODELS.length} model artifacts tracked in MLflow. Active production champion: ${production?.name} v${production?.version}.`}
          </p>
        </div>

        {/* Sync Status Badge (max-w-xs, no overflow) */}
        <div
          className="hidden lg:flex items-center gap-3 p-4 rounded-2xl border max-w-xs shrink-0 overflow-hidden"
          style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
        >
          <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
          <div className="text-xs min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              Canary Deployment Guard
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              Automated Rollback Armed
            </p>
          </div>
        </div>
      </div>

      {/* Champion Hero Card with p-6, rounded-2xl, green border, and clear hierarchy */}
      {production && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border overflow-hidden glass-card p-6"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--color-success-border)",
            boxShadow: "0 4px 24px -2px rgba(16, 185, 129, 0.15)",
          }}
        >
          <div className="space-y-6">
            {/* Top row status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-success)" }}
                >
                  Active Production Champion
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold"
                  style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
                >
                  Traffic: 100%
                </span>
              </div>

              {/* Run ID chip placed in top-right with margin to prevent clipping */}
              <div className="flex items-center gap-2 text-xs font-mono shrink-0 mr-1" style={{ color: "var(--text-muted)" }}>
                <span>Run ID:</span>
                <span
                  className="font-bold px-2 py-0.5 rounded-md border"
                  style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                >
                  {production.run_id}
                </span>
              </div>
            </div>

            {/* Left: Model Name & Description | Right: Stats Cards (stack vertically below xl) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              {/* Left Details */}
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm"
                  style={{
                    background: "var(--color-success-bg)",
                    borderColor: "var(--color-success-border)",
                    color: "var(--color-success)",
                  }}
                >
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2
                      className="text-2xl font-bold tracking-tight font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {production.name}
                    </h2>
                    <span
                      className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold border shadow-2xs"
                      style={{
                        background: "var(--accent-muted)",
                        color: "var(--accent)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      v{production.version}
                    </span>
                  </div>
                  <p className="text-sm mt-1.5 max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {production.description}
                  </p>
                </div>
              </div>

              {/* Right: Evenly spaced stats tiles — colored via getMetricStatus */}
              <div
                className="grid grid-cols-3 gap-3 p-4 rounded-2xl border flex-shrink-0"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--border-color)",
                }}
              >
                {[
                  { label: "ROC-AUC", val: production.metrics.roc_auc.toFixed(3), sub: "+3.2% vs v6", metric: "auc" as const, value: production.metrics.roc_auc },
                  { label: "Gini Index", val: production.metrics.gini.toFixed(3), sub: "High Discrim.", metric: "gini" as const, value: production.metrics.gini },
                  { label: "ECE Calibration", val: production.metrics.ece.toFixed(3), sub: "Reliable Prob.", metric: "ece" as const, value: production.metrics.ece },
                ].map(({ label, val, sub, metric, value }) => {
                  const status = getMetricStatus(metric, value);
                  const sc = getStatusColor(status);
                  return (
                  <div key={label} className="text-center px-4 py-2 min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                    <p className="text-2xl font-bold font-mono" style={{ color: sc.color }}>
                      {val}
                    </p>
                    <p className="text-[10px] font-mono mt-1 font-medium" style={{ color: sc.color }}>
                      {sub}
                    </p>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Models Grid Section */}
      <ModelGrid models={MOCK_MODELS} />
    </div>
  );
}
