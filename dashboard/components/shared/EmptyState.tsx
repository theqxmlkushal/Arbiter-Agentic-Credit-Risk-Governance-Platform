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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--accent-muted)" }}
      >
        <Icon className="w-8 h-8 text-[var(--accent)]" />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-md text-center"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
    </motion.div>
  );
}
