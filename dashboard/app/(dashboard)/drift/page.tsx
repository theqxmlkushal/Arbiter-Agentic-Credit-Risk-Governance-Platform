"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MOCK_DRIFT_SNAPSHOTS } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const DriftChart = dynamic(() => import("@/components/drift/DriftChart").then((m) => m.DriftChart), {
  ssr: false,
  loading: () => <LoadingSkeleton rows={8} />,
});

const FairnessChart = dynamic(() => import("@/components/drift/FairnessChart").then((m) => m.FairnessChart), {
  ssr: false,
  loading: () => <LoadingSkeleton rows={8} />,
});

export default function DriftPage() {
  const { mode } = useMode();
  const latest = MOCK_DRIFT_SNAPSHOTS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          Drift & Fairness
        </motion.h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Real-time drift detection and fairness metric tracking across model versions."
            : `Latest check: ${latest ? new Date(latest.created_at).toLocaleDateString() : "N/A"}. Dataset drift: ${latest?.dataset_drift ? "Detected" : "None"}.`}
        </p>
      </div>

      {/* Status cards - Telemetry mode */}
      {mode === "telemetry" && latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Drifted Features", value: latest.num_drifted, color: latest.num_drifted > 0 ? "var(--color-danger)" : "var(--color-success)" },
            { label: "DPD", value: latest.demographic_parity_diff.toFixed(4), color: latest.demographic_parity_diff > 0.1 ? "var(--color-danger)" : "var(--color-success)" },
            { label: "EOD", value: latest.equalized_odds_diff.toFixed(4), color: latest.equalized_odds_diff > 0.1 ? "var(--color-danger)" : "var(--color-success)" },
            { label: "AUC", value: latest.roc_auc.toFixed(3), color: latest.roc_auc >= 0.75 ? "var(--color-success)" : "var(--color-danger)" },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DriftChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
        <FairnessChart snapshots={MOCK_DRIFT_SNAPSHOTS} />
      </div>
    </motion.div>
  );
}
