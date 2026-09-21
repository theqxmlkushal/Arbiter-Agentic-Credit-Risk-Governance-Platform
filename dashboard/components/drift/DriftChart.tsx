"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";
import type { DriftSnapshot } from "@/lib/mock-data";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs shadow-lg"
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-color)" }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
      <p style={{ color: "var(--color-danger)" }}>
        {payload[0].value} drifted feature{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function DriftChart({ snapshots }: { snapshots: DriftSnapshot[] }) {
  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        drifted: s.num_drifted,
        dataset_drift: s.dataset_drift,
      })),
    [snapshots]
  );

  if (snapshots.length === 0) {
    return (
      <EmptyState
        title="No drift data yet"
        description="Charts populate after the first governance pipeline run."
        icon={TrendingUp}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Drifted Features Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--chart-text)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--chart-text)" }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="var(--color-success)" strokeDasharray="3 3" label="" />
          <Area
            type="monotone"
            dataKey="drifted"
            stroke="#ef4444"
            fill="url(#driftGradient)"
            strokeWidth={2}
            dot={{ r: 4, fill: "#ef4444", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
