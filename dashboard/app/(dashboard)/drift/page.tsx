"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MOCK_DRIFT_SNAPSHOTS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { TrendingUp, Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react";

const DriftChart = dynamic(
  () => import("@/components/drift/DriftChart").then((m) => m.DriftChart),
  { ssr: false, loading: () => <LoadingSkeleton rows={8} /> }
);

const FairnessChart = dynamic(
  () => import("@/components/drift/FairnessChart").then((m) => m.FairnessChart),
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
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Page Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl lg:text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Drift & Fairness
        </motion.h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Real-time drift detection and fairness metric tracking across model versions."
            : `Latest check: ${latest ? new Date(latest.created_at).toLocaleDateString() : "N/A"}. Dataset drift: ${latest?.dataset_drift ? "Detected" : "None"}.`}
        </p>
      </div>

      {/* Status Cards */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="rounded-xl p-4 flex items-center gap-3 transition-shadow duration-200"
              style={{
                background: "var(--card-bg)",
                border: `1px solid ${ok ? "var(--border-color)" : "rgba(239, 68, 68, 0.3)"}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: ok ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                }}
              >
                {ok ? (
                  <CheckCircle className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                ) : (
                  <AlertTriangle className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
                )}
              </div>
              <div>
                <p
                  className="text-lg font-bold font-mono"
                  style={{ color: ok ? "var(--color-success)" : "var(--color-danger)" }}
                >
                  {value}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div className="p-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Drifted Features Over Time
            </h3>
          </div>
          <div className="p-4">
            <DriftChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
          }}
        >
          <div className="p-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Fairness Metrics Over Time
            </h3>
          </div>
          <div className="p-4">
            <FairnessChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
