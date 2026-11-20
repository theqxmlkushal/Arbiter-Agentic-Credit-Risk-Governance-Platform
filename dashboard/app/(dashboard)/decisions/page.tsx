"use client";

import { motion } from "framer-motion";
import { DecisionsTable } from "@/components/decisions/DecisionsTable";
import { MOCK_AUDIT_LOG } from "@/lib/mock-data";
import { useMode } from "@/lib/mode-context";
import { CheckCircle2, XCircle, AlertTriangle, FileText, ShieldCheck } from "lucide-react";

export default function DecisionsPage() {
  const { mode } = useMode();

  const total = MOCK_AUDIT_LOG.length;
  const promoted = MOCK_AUDIT_LOG.filter((r) => r.decision === "promote").length;
  const rejected = MOCK_AUDIT_LOG.filter((r) => r.decision === "reject").length;
  const underReview = MOCK_AUDIT_LOG.filter((r) => r.decision === "human_review").length;

  const STAT_CARDS = [
    {
      label: "Total Decisions",
      value: total,
      subtext: "Lifecycle checkpoints",
      icon: FileText,
      color: "var(--accent)",
      bg: "var(--accent-muted)",
      border: "var(--border-color)",
    },
    {
      label: "Promoted to Production",
      value: promoted,
      subtext: `${Math.round((promoted / (total || 1)) * 100)}% approval rate`,
      icon: CheckCircle2,
      color: "var(--color-success)",
      bg: "var(--color-success-bg)",
      border: "var(--color-success-border)",
    },
    {
      label: "Rejected Candidate",
      value: rejected,
      subtext: "Policy constraints breached",
      icon: XCircle,
      color: "var(--color-danger)",
      bg: "var(--color-danger-bg)",
      border: "var(--color-danger-border)",
    },
    {
      label: "Under Human Review",
      value: underReview,
      subtext: "Marginal confidence flags",
      icon: AlertTriangle,
      color: "var(--color-warning)",
      bg: "var(--color-warning-bg)",
      border: "var(--color-warning-border)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header (32px - 36px title, muted subtitle with text-balance) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
            >
              Governance Protocol
            </span>
            <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Audit Trail
            </span>
          </div>
          <h1
            className="text-[32px] lg:text-[36px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Governance Decisions
          </h1>
          <p className="text-[15px] mt-1.5 max-w-2xl leading-relaxed text-balance" style={{ color: "var(--text-muted)" }}>
            {mode === "telemetry"
              ? "Autonomous gatekeeper logging every model promotion, rejection, and compliance review in real time."
              : `${MOCK_AUDIT_LOG.length} regulatory decisions recorded. Filter by status or inspect cryptographic evidence bundles.`}
          </p>
        </div>

        {/* Regulatory Badge (max-w-xs, no overflow) */}
        <div
          className="hidden lg:flex items-center gap-3 p-4 rounded-2xl border max-w-xs shrink-0 overflow-hidden"
          style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
        >
          <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
          <div className="text-xs min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              Zero Compliance Drift
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              Fair Lending & FCRA Enforced
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards: grid-cols-2 xl:grid-cols-4 gap-4, p-5, icon chip, large number, muted caption, hover lift */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, subtext, icon: Icon, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.18 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl p-5 border glass-card transition-all duration-150 flex flex-col justify-between"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
                style={{ background: bg, borderColor: border, color }}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div>
              <span className="text-3xl font-bold font-mono tracking-tight" style={{ color }}>
                {value}
              </span>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {subtext}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decisions Table Card: rounded-2xl, 1px border, overflow-hidden */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.18 }}
        className="rounded-2xl border glass-card overflow-hidden"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <DecisionsTable data={MOCK_AUDIT_LOG} />
      </motion.div>
    </div>
  );
}
