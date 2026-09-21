"use client";

import { motion } from "framer-motion";
import { DecisionsTable } from "@/components/decisions/DecisionsTable";
import { MOCK_AUDIT_LOG } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";

const STAT_CARDS = [
  {
    label: "Total Decisions",
    value: MOCK_AUDIT_LOG.length,
    icon: FileText,
    color: "var(--accent)",
    bg: "var(--accent-muted)",
  },
  {
    label: "Promoted",
    value: MOCK_AUDIT_LOG.filter((r) => r.decision === "promote").length,
    icon: CheckCircle,
    color: "var(--color-success)",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  {
    label: "Rejected",
    value: MOCK_AUDIT_LOG.filter((r) => r.decision === "reject").length,
    icon: XCircle,
    color: "var(--color-danger)",
    bg: "rgba(239, 68, 68, 0.1)",
  },
  {
    label: "Under Review",
    value: MOCK_AUDIT_LOG.filter((r) => r.decision === "human_review").length,
    icon: AlertTriangle,
    color: "var(--color-warning)",
    bg: "rgba(245, 158, 11, 0.1)",
  },
];

export default function DecisionsPage() {
  const { mode } = useMode();

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
          Governance Decisions
        </motion.h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {mode === "telemetry"
            ? "Real-time audit trail of every model promotion, rejection, and review decision."
            : `${MOCK_AUDIT_LOG.length} decisions recorded. Filter by status or search by model name.`}
        </p>
      </div>

      {/* Stats Row — always visible in both modes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -2, scale: 1.02 }}
            className="rounded-xl p-4 flex items-center gap-3 transition-shadow duration-200"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold font-mono" style={{ color }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <div className="p-4 lg:p-5" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Audit Log
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Click any row to view the full evidence bundle
          </p>
        </div>
        <DecisionsTable data={MOCK_AUDIT_LOG} />
      </motion.div>
    </motion.div>
  );
}
