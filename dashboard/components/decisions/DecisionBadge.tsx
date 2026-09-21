"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const STYLES = {
  promote: {
    bg: "var(--badge-promote-bg)",
    text: "var(--badge-promote-text)",
    icon: CheckCircle,
    label: "Promote",
  },
  reject: {
    bg: "var(--badge-reject-bg)",
    text: "var(--badge-reject-text)",
    icon: XCircle,
    label: "Reject",
  },
  human_review: {
    bg: "var(--badge-review-bg)",
    text: "var(--badge-review-text)",
    icon: AlertTriangle,
    label: "Review",
  },
} as const;

export function DecisionBadge({ decision }: { decision: string }) {
  const style =
    STYLES[decision as keyof typeof STYLES] || STYLES.human_review;
  const Icon = style.icon;

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </motion.span>
  );
}
