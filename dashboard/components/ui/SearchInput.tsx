"use client";

import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10">
        <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2 rounded-xl text-sm outline-none transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-indigo-500"
        style={{
          background: "var(--input-bg)",
          color: "var(--text-primary)",
          borderColor: "var(--border-color)",
        }}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center hover:bg-slate-500/10 transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
