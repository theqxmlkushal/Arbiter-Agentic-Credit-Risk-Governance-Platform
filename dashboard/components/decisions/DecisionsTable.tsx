"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { DecisionBadge } from "./DecisionBadge";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { useMode } from "@/lib/mode-context";
import type { AuditLogEntry } from "@/lib/mock-data";

const PAGE_SIZE = 10;

export function DecisionsTable({ data }: { data: AuditLogEntry[] }) {
  const { mode } = useMode();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    let result = data;
    if (filter !== "all") result = result.filter((r) => r.decision === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.model_name.toLowerCase().includes(q) ||
          r.rationale.toLowerCase().includes(q) ||
          String(r.model_version).includes(q)
      );
    }
    return [...result].sort((a, b) =>
      sortDir === "desc"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [data, filter, search, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (data.length === 0) {
    return (
      <EmptyState
        title="No governance decisions"
        description="Decisions appear here after the first model promotion cycle runs."
      />
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex-1 w-full sm:max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search decisions..." />
        </div>
        <div className="flex items-center gap-2">
          {["all", "promote", "reject", "human_review"].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFilter(f); setPage(0); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: filter === f ? "var(--accent)" : "var(--input-bg)",
                color: filter === f ? "white" : "var(--text-secondary)",
              }}
            >
              {f === "all" ? "All" : f === "human_review" ? "Review" : f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full dense-table">
            <thead>
              <tr style={{ background: "var(--input-bg)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  <button onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                    Time
                    {sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Model</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Version</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Decision</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Rationale</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group transition-colors duration-150 cursor-pointer"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-raised)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {entry.model_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                        style={{
                          background: "var(--accent-muted)",
                          color: "var(--accent)",
                        }}
                      >
                        {entry.model_version}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={entry.decision} />
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {entry.rationale.slice(0, 100)}...
                    </td>
                    <td className="px-4 py-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </motion.div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border-color)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} results
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
              >
                Prev
              </motion.button>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {page + 1} / {totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg text-xs font-medium disabled:opacity-30"
                style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
              >
                Next
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <EvidenceDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </>
  );
}
