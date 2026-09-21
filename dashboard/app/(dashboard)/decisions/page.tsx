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
    bg: "rgba(16, 185, 129, 0.12)",
  },
  {
    label: "Rejected",
    value: MOCK_AUDIT_LOG.filter((r) => r.decision === "reject").length,
    icon: XCircle,
    color: "var(--color-danger)",
    bg: "rgba(239, 68, 68, 0.12)",
  },
  {
    label: "Under Review",
    value: MOCK_AUDIT_LOG.filter((r) => r.decision === "human_review").length,
    icon: AlertTriangle,
    color: "var(--color-warning)",
    bg: "rgba(245, 158, 11, 0.12)",
  },
];

export default function DecisionsPage() {
  const { mode } = useMode();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6"
    >
      {/* Page Header */}
      <div className="pb-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Governance Decisions
        </motion.h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          {mode === "telemetry"
            ? "Real-time audit trail of every model promotion, rejection, and review decision."
            : `${MOCK_AUDIT_LOG.length} decisions recorded. Filter by status or search by model name.`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className="rounded-xl p-5 flex items-center gap-4 transition-all duration-200"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold font-mono leading-none" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <DecisionsTable data={MOCK_AUDIT_LOG} />
      </motion.div>
    </motion.div>
  );
}
