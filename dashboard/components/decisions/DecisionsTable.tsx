"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ExternalLink, Search, X } from "lucide-react";
import { DecisionBadge } from "./DecisionBadge";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import type { AuditLogEntry } from "@/lib/mock-data";

const PAGE_SIZE = 10;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "promote", label: "Promoted" },
  { key: "reject", label: "Rejected" },
  { key: "human_review", label: "Review" },
] as const;

export function DecisionsTable({ data }: { data: AuditLogEntry[] }) {
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
      {/* Toolbar: Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 lg:p-5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by model, version, or rationale..."
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(0); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => { setFilter(key); setPage(0); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--accent)" : "var(--input-bg)",
                  color: active ? "white" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-color)"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <div className="hidden sm:flex items-center ml-auto">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                { key: "time", label: "Time", sortable: true },
                { key: "model", label: "Model" },
                { key: "version", label: "Ver" },
                { key: "decision", label: "Decision" },
                { key: "rationale", label: "Rationale", hideOnMobile: true },
                { key: "evidence", label: "" },
              ].map(({ key, label, sortable, hideOnMobile }) => (
                <th
                  key={key}
                  className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider ${hideOnMobile ? "hidden md:table-cell" : ""}`}
                  style={{
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border-color)",
                    background: "transparent",
                  }}
                >
                  {sortable ? (
                    <button
                      onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                      className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      {label}
                      {sortDir === "desc" ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paged.map((entry, i) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025, duration: 0.2 }}
                  className="group cursor-pointer transition-colors duration-100"
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => setSelectedEntry(entry)}
                >
                  {/* Time */}
                  <td
                    className="px-4 py-3 text-sm whitespace-nowrap"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  {/* Model */}
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-medium font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {entry.model_name}
                    </span>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
                      style={{
                        background: "var(--accent-muted)",
                        color: "var(--accent)",
                      }}
                    >
                      {entry.model_version}
                    </span>
                  </td>

                  {/* Decision */}
                  <td className="px-4 py-3">
                    <DecisionBadge decision={entry.decision} />
                  </td>

                  {/* Rationale (truncated) */}
                  <td
                    className="px-4 py-3 text-sm max-w-[280px] truncate hidden md:table-cell"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {entry.rationale.slice(0, 80)}…
                  </td>

                  {/* Evidence icon */}
                  <td className="px-4 py-3">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 lg:px-5 py-3"
          style={{ borderTop: "1px solid var(--border-color)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </>
  );
}
