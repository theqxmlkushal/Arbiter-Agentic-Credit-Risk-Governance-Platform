"use client";

import { motion } from "framer-motion";
import { ModelGrid } from "@/components/models/ModelGrid";
import { MOCK_MODELS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { Activity } from "lucide-react";

export default function ModelsPage() {
  const { mode } = useMode();
  const production = MOCK_MODELS.find((m) => m.stage === "Production");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8"
    >
      {/* Page Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Model Registry
        </motion.h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          {mode === "telemetry"
            ? "Live view of all registered models, their stages, and performance metrics."
            : `${MOCK_MODELS.length} model versions. Current champion: ${production?.name} v${production?.version}.`}
        </p>
      </div>

      {/* Production Champion Card */}
      {production && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--color-success)",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.08)",
          }}
        >
          <div className="p-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-success)" }}>
                Currently in Production
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-6">
              {/* Model Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                  <Activity className="w-6 h-6" style={{ color: "var(--color-success)" }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {production.name}
                    <span className="ml-2 text-sm font-mono" style={{ color: "var(--accent)" }}>
                      v{production.version}
                    </span>
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {production.description}
                  </p>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="flex items-center gap-6 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                {[
                  { label: "AUC", val: production.metrics.roc_auc.toFixed(3), good: production.metrics.roc_auc >= 0.8 },
                  { label: "Gini", val: production.metrics.gini.toFixed(3), good: production.metrics.gini >= 0.6 },
                  { label: "ECE", val: production.metrics.ece.toFixed(3), good: production.metrics.ece <= 0.04 },
                ].map(({ label, val, good }) => (
                  <div key={label} className="flex-1 text-center">
                    <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                    <p className="text-xl font-bold font-mono" style={{ color: good ? "var(--color-success)" : "var(--color-danger)" }}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Models Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ModelGrid models={MOCK_MODELS} />
      </motion.div>
    </motion.div>
  );
}
