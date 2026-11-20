"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  description = "Failed to load data. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border"
        style={{
          background: "var(--color-danger-bg)",
          borderColor: "var(--color-danger-border)",
          color: "var(--color-danger)",
        }}
      >
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3
        className="text-base font-semibold mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-xs sm:text-sm max-w-md mb-5 leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ background: "var(--accent)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </motion.div>
  );
}
