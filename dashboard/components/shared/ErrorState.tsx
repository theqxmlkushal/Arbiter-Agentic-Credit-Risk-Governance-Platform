"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-red-500/10">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-md text-center mb-4" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}
