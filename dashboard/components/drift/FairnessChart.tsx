"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { Shield } from "lucide-react";
import type { DriftSnapshot } from "@/lib/mock-data";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-3.5 rounded-xl text-xs shadow-xl border backdrop-blur-md"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-color)",
      }}
    >
      <p className="font-bold text-xs mb-1.5" style={{ color: "var(--text-primary)" }}>
        Audit Checkpoint: {label}
      </p>
      <div className="space-y-1.5 font-mono">
        {payload.map((p) => {
          const isBreached = p.value > 0.1;
          return (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: isBreached ? "var(--color-danger)" : p.color }}
                />
                <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
              </span>
              <span
                className="font-bold"
                style={{ color: isBreached ? "var(--color-danger)" : "var(--text-primary)" }}
              >
                {p.value.toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-1.5 border-t flex items-center justify-between text-[10px]" style={{ borderColor: "var(--border-subtle)" }}>
        <span style={{ color: "var(--text-muted)" }}>Safety Threshold:</span>
        <span className="font-mono font-bold text-red-500">≤ 0.1000</span>
      </div>
    </div>
  );
}

export function FairnessChart({ snapshots }: { snapshots: DriftSnapshot[] }) {
  // Reverse the array at render time only (don't mutate source data) so axis reads left to right, oldest to newest
  const chartData = useMemo(
    () =>
      [...snapshots].reverse().map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
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
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, right: 75, left: -10, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--chart-text)" }}
            axisLine={{ stroke: "var(--border-color)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--chart-text)" }}
            domain={[0, 0.15]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          
          {/* Reference Line with label placed on the right with ample margin so it never cuts off */}
          <ReferenceLine
            y={0.1}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: "Limit (0.10)",
              position: "right",
              fontSize: 10,
              fill: "#ef4444",
            }}
          />

          {/* DPD Bar with base fill for legend + dynamic Red fill if above 0.10 limit */}
          <Bar dataKey="DPD" name="Demographic Parity Diff" fill="#6366f1" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`dpd-${index}`}
                fill={entry.DPD > 0.1 ? "#ef4444" : "#6366f1"}
              />
            ))}
          </Bar>

          {/* EOD Bar with base fill for legend + dynamic Red fill if above 0.10 limit */}
          <Bar dataKey="EOD" name="Equalized Odds Diff" fill="#38bdf8" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`eod-${index}`}
                fill={entry.EOD > 0.1 ? "#ef4444" : "#38bdf8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
