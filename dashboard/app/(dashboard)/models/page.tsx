"use client";

import { motion } from "framer-motion";
import { ModelGrid } from "@/components/models/ModelGrid";
import { MOCK_MODELS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";

export default function ModelsPage() {
  const { mode } = useMode();
  const production = MOCK_MODELS.find((m) => m.stage === "Production");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Model Registry
        </motion.h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Live view of all registered models, their stages, and performance metrics."
            : `${MOCK_MODELS.length} model versions. Current champion: ${production?.name} v${production?.version}.`}
        </p>
      </div>

      {/* Production highlight */}
      {mode === "telemetry" && production && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card glow-border rounded-2xl p-6 mb-6"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-success)" }}>
              Currently in Production
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {production.name} v{production.version}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {production.description}
              </p>
            </div>
            <div className="flex gap-4 sm:ml-auto">
              {[
                { label: "AUC", val: production.metrics.roc_auc.toFixed(3) },
                { label: "Gini", val: production.metrics.gini.toFixed(3) },
                { label: "ECE", val: production.metrics.ece.toFixed(3) },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-lg font-bold font-mono glow-text" style={{ color: "var(--accent)" }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <ModelGrid models={MOCK_MODELS} />
    </motion.div>
  );
}
