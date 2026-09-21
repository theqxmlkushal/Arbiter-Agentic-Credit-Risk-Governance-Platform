"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MOCK_DRIFT_SNAPSHOTS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  TrendingUp,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const DriftChart = dynamic(
  () => import("@/components/drift/DriftChart").then((m) => m.DriftChart),
  { ssr: false, loading: () => <LoadingSkeleton rows={8} /> }
);

const FairnessChart = dynamic(
  () =>
    import("@/components/drift/FairnessChart").then((m) => m.FairnessChart),
  { ssr: false, loading: () => <LoadingSkeleton rows={8} /> }
);

export default function DriftPage() {
  const { mode } = useMode();
  const latest = MOCK_DRIFT_SNAPSHOTS[0];

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
          Drift & Fairness
        </motion.h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Real-time drift detection and fairness metric tracking across model versions."
            : `Latest check: ${latest ? new Date(latest.created_at).toLocaleDateString() : "N/A"}. Dataset drift: ${latest?.dataset_drift ? "Detected" : "None"}.`}
        </p>
      </div>

      {/* Status Cards */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Drifted Features",
              value: latest.num_drifted,
              icon: TrendingUp,
              ok: latest.num_drifted === 0,
            },
            {
              label: "DPD",
              value: latest.demographic_parity_diff.toFixed(4),
              icon: Shield,
              ok: latest.demographic_parity_diff <= 0.1,
            },
            {
              label: "EOD",
              value: latest.equalized_odds_diff.toFixed(4),
              icon: Shield,
              ok: latest.equalized_odds_diff <= 0.1,
            },
            {
              label: "ROC-AUC",
              value: latest.roc_auc.toFixed(3),
              icon: Activity,
              ok: latest.roc_auc >= 0.75,
            },
          ].map(({ label, value, icon: Icon, ok }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="rounded-xl p-5 flex items-center gap-4 transition-all duration-200"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${ok ? "var(--card-border)" : "rgba(239, 68, 68, 0.3)"}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: ok
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(239, 68, 68, 0.12)",
                }}
              >
                {ok ? (
                  <CheckCircle
                    className="w-6 h-6"
                    style={{ color: "var(--color-success)" }}
                  />
                ) : (
                  <AlertTriangle
                    className="w-6 h-6"
                    style={{ color: "var(--color-danger)" }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-xl font-bold font-mono leading-none"
                  style={{
                    color: ok ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  {value}
                </p>
                <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Drifted Features Over Time
            </h3>
          </div>
          <div className="p-6">
            <DriftChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Fairness Metrics Over Time
            </h3>
          </div>
          <div className="p-6">
            <FairnessChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
