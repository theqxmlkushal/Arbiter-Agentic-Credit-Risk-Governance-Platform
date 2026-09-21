"use client";

import { motion } from "framer-motion";
import { DecisionsTable } from "@/components/decisions/DecisionsTable";
import { MOCK_AUDIT_LOG } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";

export default function DecisionsPage() {
  const { mode } = useMode();

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
          Governance Decisions
        </motion.h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Real-time audit trail of every model promotion, rejection, and review decision."
            : `${MOCK_AUDIT_LOG.length} decisions recorded. Filter by status or search by model name.`}
        </p>
      </div>

      {/* Stats row - Telemetry mode */}
      {mode === "telemetry" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: MOCK_AUDIT_LOG.length, color: "var(--accent)" },
            { label: "Promoted", value: MOCK_AUDIT_LOG.filter((r) => r.decision === "promote").length, color: "var(--color-success)" },
            { label: "Rejected", value: MOCK_AUDIT_LOG.filter((r) => r.decision === "reject").length, color: "var(--color-danger)" },
            { label: "Review", value: MOCK_AUDIT_LOG.filter((r) => r.decision === "human_review").length, color: "var(--color-warning)" },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <p className="text-2xl font-bold font-mono glow-text" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <DecisionsTable data={MOCK_AUDIT_LOG} />
    </motion.div>
  );
}
