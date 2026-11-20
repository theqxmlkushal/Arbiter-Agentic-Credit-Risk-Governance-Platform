"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "No data yet",
  description = "Data will appear here once the governance pipeline runs.",
  icon: Icon = Inbox,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-sm"
        style={{
          background: "var(--accent-muted)",
          borderColor: "var(--border-color)",
          color: "var(--accent)",
        }}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h3
        className="text-base font-semibold mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-xs sm:text-sm max-w-md leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </p>
    </motion.div>
  );
}
