"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck } from "lucide-react";
import { useMode } from "@/lib/mode-context";

export function ModeToggle() {
  const { mode, toggle } = useMode();
  const isTelemetry = mode === "telemetry";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={toggle}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-colors duration-150 border cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      style={{
        background: isTelemetry ? "var(--accent-muted)" : "var(--input-bg)",
        borderColor: isTelemetry ? "var(--accent)" : "var(--border-color)",
        color: isTelemetry ? "var(--accent)" : "var(--text-secondary)",
      }}
      aria-label={`Toggle mode. Current mode: ${mode}`}
      title={`Current mode: ${mode}. Click to toggle.`}
    >
      <motion.div
        key={mode}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1.5"
      >
        {isTelemetry ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <Activity className="w-3.5 h-3.5" />
          </>
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <span>{isTelemetry ? "Telemetry" : "Auditor"}</span>
      </motion.div>
    </motion.button>
  );
}
