"use client";

import { motion } from "framer-motion";
import { ExternalLink, Box, Award, TrendingUp, TrendingDown } from "lucide-react";
import { MOCK_MODELS, type ModelVersion } from "@/lib/mock-data";
import { getMetricStatus, getStatusColor } from "@/lib/ui-helpers";

const STAGE_STYLES = {
  Production: {
    bg: "var(--badge-promote-bg)",
    text: "var(--color-success)",
    dot: "#10b981",
    border: "var(--color-success-border)",
    glow: "rgba(16, 185, 129, 0.18)",
  },
  Staging: {
    bg: "var(--color-info-bg)",
    text: "var(--color-info)",
    dot: "#0284c7",
    border: "var(--color-info-border)",
    glow: "rgba(2, 132, 199, 0.18)",
  },
  Archived: {
    bg: "rgba(148, 163, 184, 0.1)",
    text: "var(--text-muted)",
    dot: "#94a3b8",
    border: "var(--border-color)",
    glow: "transparent",
  },
  None: {
    bg: "rgba(148, 163, 184, 0.1)",
    text: "var(--text-muted)",
    dot: "#94a3b8",
    border: "var(--border-color)",
    glow: "transparent",
  },
} as const;

export function ModelCard({ model, index }: { model: ModelVersion; index: number }) {
  const stage = STAGE_STYLES[model.stage] || STAGE_STYLES.None;
  const isProduction = model.stage === "Production";
  const isArchived = model.stage === "Archived";

  // Calculate delta vs previous version at render time from existing MOCK_MODELS array
  const prevModel = MOCK_MODELS.find(
    (m) => m.name === model.name && m.version === model.version - 1
  );
  const aucDiff = prevModel ? model.metrics.roc_auc - prevModel.metrics.roc_auc : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      whileHover={{ y: -3 }}
      className={`rounded-2xl transition-all duration-150 flex flex-col justify-between border glass-card overflow-hidden group cursor-pointer ${
        isArchived ? "opacity-80 hover:opacity-100" : ""
      }`}
      style={{
        background: "var(--card-bg)",
        borderColor: isProduction ? stage.border : "var(--card-border)",
        boxShadow: isProduction ? `0 0 16px ${stage.glow}` : "var(--card-shadow)",
      }}
    >
      <div className="p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs"
              style={{
                background: isProduction ? "var(--color-success-bg)" : "var(--accent-muted)",
                borderColor: isProduction ? "var(--color-success-border)" : "var(--border-color)",
                color: isProduction ? "var(--color-success)" : "var(--accent)",
              }}
            >
              {isProduction ? <Award className="w-5 h-5" /> : <Box className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {model.name}
              </h3>
              <p className="text-xs font-mono mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                v{model.version} · {model.run_id}
              </p>
            </div>
          </div>

          {/* Stage Badge - shrink-0 whitespace-nowrap, never clipped */}
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shrink-0 whitespace-nowrap"
            style={{
              background: stage.bg,
              color: stage.text,
              borderColor: stage.border,
            }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isProduction ? "animate-pulse" : ""}`}
              style={{ background: stage.dot }}
            />
            {model.stage}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {model.description}
        </p>

        {/* Metric tiles: evenly spaced grid-cols-3 gap-3 — colored via getMetricStatus + delta arrow */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            {
              label: "AUC",
              value: model.metrics.roc_auc,
              metric: "auc" as const,
              delta: aucDiff !== null ? (aucDiff >= 0 ? `+${(aucDiff * 100).toFixed(1)}%` : `${(aucDiff * 100).toFixed(1)}%`) : null,
              deltaPositive: aucDiff !== null ? aucDiff >= 0 : true,
            },
            { label: "Gini", value: model.metrics.gini, metric: "gini" as const, delta: null, deltaPositive: true },
            { label: "ECE", value: model.metrics.ece, metric: "ece" as const, delta: null, deltaPositive: true },
          ].map(({ label, value, metric, delta, deltaPositive }) => {
            const status = getMetricStatus(metric, value);
            const sc = getStatusColor(status);
            return (
              <div
                key={label}
                className="text-center p-3 rounded-xl border flex flex-col justify-center"
                style={{
                  background: "var(--surface-raised)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: sc.color }}
                >
                  {value.toFixed(3)}
                </p>
                {delta && (
                  <p className={`text-[10px] font-mono mt-0.5 font-semibold flex items-center justify-center gap-0.5 ${deltaPositive ? "text-emerald-500" : "text-rose-500"}`}>
                    {deltaPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    <span>{delta}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Footer with MLflow link — pt-3, border-t, spaced */}
      <div
        className="flex items-center justify-between px-5 pt-3 pb-3 border-t text-xs transition-colors duration-150"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-color)",
        }}
      >
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {model.created_at}
        </span>
        <div
          className="flex items-center gap-1.5 text-xs font-semibold opacity-75 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
          style={{ color: "var(--accent)" }}
        >
          <span>View in MLflow</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}
