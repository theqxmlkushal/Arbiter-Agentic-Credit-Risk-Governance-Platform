"use client";

import { motion } from "framer-motion";
import { ExternalLink, Activity } from "lucide-react";
import type { ModelVersion } from "@/lib/mock-data";

const STAGE_STYLES = {
  Production: {
    bg: "rgba(16, 185, 129, 0.1)",
    text: "var(--color-success)",
    dot: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
  },
  Staging: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "var(--color-info)",
    dot: "#3b82f6",
    border: "rgba(59, 130, 246, 0.3)",
  },
  Archived: {
    bg: "var(--input-bg)",
    text: "var(--text-muted)",
    dot: "var(--text-muted)",
    border: "var(--border-color)",
  },
  None: {
    bg: "var(--input-bg)",
    text: "var(--text-muted)",
    dot: "var(--text-muted)",
    border: "var(--border-color)",
  },
} as const;

export function ModelCard({
  model,
  index,
}: {
  model: ModelVersion;
  index: number;
}) {
  const stage = STAGE_STYLES[model.stage] || STAGE_STYLES.None;
  const isProduction = model.stage === "Production";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      whileHover={{ y: -3 }}
      className="rounded-xl p-5 transition-all duration-200 group cursor-pointer"
      style={{
        background: "var(--card-bg)",
        border: `1px solid ${isProduction ? stage.border : "var(--card-border)"}`,
      }}
    >
      {/* Header: Icon + Name + Stage */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-muted)" }}
          >
            <Activity className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {model.name}
            </h3>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              v{model.version} · {model.run_id}
            </p>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
          style={{ background: stage.bg, color: stage.text }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: stage.dot }}
          />
          {model.stage}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "AUC", value: model.metrics.roc_auc },
          { label: "Gini", value: model.metrics.gini },
          { label: "ECE", value: model.metrics.ece },
        ].map(({ label, value }) => {
          const good =
            label === "AUC"
              ? value >= 0.8
              : label === "Gini"
              ? value >= 0.6
              : value <= 0.04;
          return (
            <div
              key={label}
              className="text-center p-2 rounded-lg"
              style={{ background: "var(--input-bg)" }}
            >
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <p
                className="text-sm font-bold font-mono"
                style={{ color: good ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {value.toFixed(3)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {model.created_at}
        </p>
        <div
          className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "var(--accent)" }}
        >
          View in MLflow <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
