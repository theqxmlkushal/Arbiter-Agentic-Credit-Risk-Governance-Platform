"use client";

import { motion } from "framer-motion";
import { ModelGrid } from "@/components/models/ModelGrid";
import { MOCK_MODELS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { Activity, TrendingUp } from "lucide-react";

export default function ModelsPage() {
  const { mode } = useMode();
  const production = MOCK_MODELS.find((m) => m.stage === "Production");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Page Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl lg:text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Model Registry
        </motion.h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Live view of all registered models, their stages, and performance metrics."
            : `${MOCK_MODELS.length} model versions. Current champion: ${production?.name} v${production?.version}.`}
        </p>
      </div>

      {/* Production Champion Card */}
      {production && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-5 glow-border"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--color-success)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-success)" }}
            >
              Currently in Production
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(16, 185, 129, 0.1)" }}
                >
                  <Activity className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {production.name}
                    <span className="ml-2 text-sm font-mono" style={{ color: "var(--accent)" }}>
                      v{production.version}
                    </span>
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {production.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-5 sm:ml-auto">
              {[
                { label: "AUC", val: production.metrics.roc_auc.toFixed(3), good: production.metrics.roc_auc >= 0.8 },
                { label: "Gini", val: production.metrics.gini.toFixed(3), good: production.metrics.gini >= 0.6 },
                { label: "ECE", val: production.metrics.ece.toFixed(3), good: production.metrics.ece <= 0.04 },
              ].map(({ label, val, good }) => (
                <div key={label} className="text-center">
                  <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                  <p
                    className="text-lg font-bold font-mono"
                    style={{ color: good ? "var(--color-success)" : "var(--color-danger)" }}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Models Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ModelGrid models={MOCK_MODELS} />
      </motion.div>
    </motion.div>
  );
}
