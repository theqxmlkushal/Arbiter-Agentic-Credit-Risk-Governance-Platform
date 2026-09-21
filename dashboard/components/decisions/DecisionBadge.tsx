"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const STYLES = {
  promote: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#34d399",
    border: "rgba(16, 185, 129, 0.25)",
    icon: CheckCircle,
    label: "Promote",
  },
  reject: {
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#f87171",
    border: "rgba(239, 68, 68, 0.25)",
    icon: XCircle,
    label: "Reject",
  },
  human_review: {
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#fbbf24",
    border: "rgba(245, 158, 11, 0.25)",
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {style.label}
    </motion.span>
  );
}
