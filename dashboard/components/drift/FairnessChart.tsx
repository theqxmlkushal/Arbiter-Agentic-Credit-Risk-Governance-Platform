"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/EmptyState";
import { Shield } from "lucide-react";
import type { DriftSnapshot } from "@/lib/mock-data";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs shadow-lg"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-color)" }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(4)}
        </p>
      ))}
    </div>
  );
}

export function FairnessChart({ snapshots }: { snapshots: DriftSnapshot[] }) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        DPD: s.demographic_parity_diff,
        EOD: s.equalized_odds_diff,
      })),
    [snapshots]
  );

  if (snapshots.length === 0) {
    return (
      <EmptyState
        title="No fairness data yet"
        description="Fairness metrics appear after the first governance pipeline run."
        icon={Shield}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl p-4"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Fairness Metrics Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--chart-text)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--chart-text)" }} domain={[0, 0.15]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0.1} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Threshold", position: "right", fontSize: 10, fill: "#ef4444" }} />
          <Bar dataKey="DPD" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="EOD" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
