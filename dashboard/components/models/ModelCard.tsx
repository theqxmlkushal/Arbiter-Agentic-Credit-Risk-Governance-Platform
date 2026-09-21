"use client";

import { motion } from "framer-motion";
import { ExternalLink, Activity } from "lucide-react";
import type { ModelVersion } from "@/lib/mock-data";

const STAGE_COLORS = {
  Production: { bg: "#064e3b", text: "#6ee7b7", dot: "#10b981" },
  Staging: { bg: "#1e3a5f", text: "#93c5fd", dot: "#3b82f6" },
  Archived: { bg: "var(--input-bg)", text: "var(--text-muted)", dot: "var(--text-muted)" },
  None: { bg: "var(--input-bg)", text: "var(--text-muted)", dot: "var(--text-muted)" },
};

export function ModelCard({
  model,
  index,
}: {
  model: ModelVersion;
  index: number;
}) {
  const stage = STAGE_COLORS[model.stage] || STAGE_COLORS.None;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card rounded-2xl p-5 transition-all duration-300 group cursor-pointer"
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${model.stage === "Production" ? "var(--color-success)" : "var(--card-border)"}`,
        boxShadow: model.stage === "Production" ? "0 0 20px var(--glow-color)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent-muted)" }}
          >
            <Activity className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {model.name}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              v{model.version} · {model.run_id}
            </p>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: stage.bg, color: stage.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.dot }} />
          {model.stage}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "AUC", value: model.metrics.roc_auc.toFixed(3) },
          { label: "Gini", value: model.metrics.gini.toFixed(3) },
          { label: "ECE", value: model.metrics.ece.toFixed(3) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="text-center p-2 rounded-lg"
            style={{ background: "var(--input-bg)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {model.created_at}
        </p>
        <motion.div
          whileHover={{ x: 3 }}
          className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--accent)" }}
        >
          View in MLflow <ExternalLink className="w-3 h-3" />
        </motion.div>
      </div>
    </motion.div>
  );
}
