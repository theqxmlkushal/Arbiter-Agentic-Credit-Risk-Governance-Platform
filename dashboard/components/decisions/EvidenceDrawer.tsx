"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { AuditLogEntry } from "@/lib/mock-data";

function JsonValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return <span style={{ color: "var(--json-bool)" }}>{value ? "true" : "false"}</span>;
  }
  if (typeof value === "number") {
    return <span style={{ color: "var(--json-number)" }}>{value}</span>;
  }
  if (typeof value === "string") {
    return <span style={{ color: "var(--json-string)" }}>&quot;{value}&quot;</span>;
  }
  if (Array.isArray(value)) {
    return (
      <span>
        [{"\n"}
        {value.map((v, i) => (
          <span key={i} className="pl-4">
            {"  "}
            <JsonValue value={v} />
            {i < value.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        ]
      </span>
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <span>
        {"{\n"}
        {entries.map(([k, v], i) => (
          <span key={k} className="pl-4">
            {"  "}
            <span style={{ color: "var(--json-key)" }}>&quot;{k}&quot;</span>:{" "}
            <JsonValue value={v} />
            {i < entries.length - 1 ? "," : ""}
            {"\n"}
          </span>
        ))}
        {"}"}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

export function EvidenceDrawer({
  entry,
  onClose,
}: {
  entry: AuditLogEntry | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (entry) {
      navigator.clipboard.writeText(JSON.stringify(entry.evidence, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {entry && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
            style={{
              background: "var(--surface)",
              borderLeft: "1px solid var(--border-color)",
            }}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Evidence Bundle
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {entry.model_name} v{entry.model_version}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            <div className="p-4">
              <pre
                className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words p-4 rounded-xl overflow-x-auto"
                style={{
                  background: "var(--input-bg)",
                  color: "var(--text-primary)",
                }}
              >
                <JsonValue value={entry.evidence} />
              </pre>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
