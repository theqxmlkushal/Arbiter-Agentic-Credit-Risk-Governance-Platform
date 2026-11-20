"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const STYLES = {
  promote: {
    bg: "var(--badge-promote-bg)",
    text: "var(--badge-promote-text)",
    border: "var(--badge-promote-border)",
    dot: "#10b981",
    icon: CheckCircle2,
    label: "Promote",
  },
  reject: {
    bg: "var(--badge-reject-bg)",
    text: "var(--badge-reject-text)",
    border: "var(--badge-reject-border)",
    dot: "#ef4444",
    icon: XCircle,
    label: "Reject",
  },
  human_review: {
    bg: "var(--badge-review-bg)",
    text: "var(--badge-review-text)",
    border: "var(--badge-review-border)",
    dot: "#f59e0b",
    icon: AlertTriangle,
    label: "Review",
  },
} as const;

export function DecisionBadge({ decision }: { decision: string }) {
  const style = STYLES[decision as keyof typeof STYLES] || STYLES.human_review;
  const Icon = style.icon;

  return (
    <motion.span
      whileHover={{ scale: 1.03 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide border shadow-2xs select-none shrink-0 whitespace-nowrap"
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: style.dot }}
      />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium">{style.label}</span>
    </motion.span>
  );
}
