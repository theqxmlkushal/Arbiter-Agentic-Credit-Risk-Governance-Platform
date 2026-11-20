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
} from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";
import type { DriftSnapshot } from "@/lib/mock-data";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div
      className="p-3.5 rounded-xl text-xs shadow-xl border backdrop-blur-md"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-color)",
      }}
    >
      <p className="font-bold text-xs mb-1" style={{ color: "var(--text-primary)" }}>
        Audit Checkpoint: {label}
      </p>
      <div className="flex items-center gap-1.5 font-mono">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: count > 0 ? "var(--color-danger)" : "var(--color-success)" }}
        />
        <span
          className="font-semibold"
          style={{ color: count > 0 ? "var(--color-danger)" : "var(--color-success)" }}
        >
          {count} drifted feature{count !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-[11px] mt-1 text-slate-400">
        {count === 0 ? "Distribution stability verified" : "Covariate shift flagged"}
      </p>
    </div>
  );
}

export function DriftChart({ snapshots }: { snapshots: DriftSnapshot[] }) {
  // Reverse the array at render time only (don't mutate source data) so axis reads left to right, oldest to newest
  const chartData = useMemo(
    () =>
      [...snapshots].reverse().map((s) => ({
        date: new Date(s.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        drifted: s.num_drifted,
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
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 20, bottom: 25 }}>
          <defs>
            <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--chart-text)" }}
            axisLine={{ stroke: "var(--border-color)" }}
            tickLine={false}
            label={{
              value: "Audit Evaluation Timeline",
              position: "insideBottom",
              offset: -12,
              fontSize: 10,
              fill: "var(--chart-text)",
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--chart-text)" }}
            domain={[0, "auto"]}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Drifted features",
              angle: -90,
              position: "insideLeft",
              offset: 5,
              fontSize: 10,
              fill: "var(--chart-text)",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="drifted"
            stroke="#f43f5e"
            fill="url(#driftGradient)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#f43f5e", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#f43f5e", stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
