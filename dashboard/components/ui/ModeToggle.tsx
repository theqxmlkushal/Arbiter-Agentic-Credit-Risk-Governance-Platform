"use client";

import { motion } from "framer-motion";
import { Activity, Table2 } from "lucide-react";
import { useMode } from "@/lib/mode-context";

export function ModeToggle() {
  const { mode, toggle } = useMode();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300"
      style={{
        background: "var(--input-bg)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <motion.div
        key={mode}
        initial={{ x: -5, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {mode === "telemetry" ? (
          <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
        ) : (
          <Table2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
        )}
      </motion.div>
      <span>{mode === "telemetry" ? "Telemetry" : "Auditor"}</span>
    </motion.button>
  );
}
