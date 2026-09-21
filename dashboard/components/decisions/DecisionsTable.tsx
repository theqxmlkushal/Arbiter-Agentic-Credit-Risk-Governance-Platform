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
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="px-6 py-5 space-y-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
        {/* Search row */}
        <div className="relative max-w-lg">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by model, version, or rationale..."
            className="w-full pl-11 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            }}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter row: pills left, count right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setPage(0); }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
                  style={{
                    background: active ? "var(--accent)" : "rgba(255,255,255,0.06)",
                    color: active ? "white" : "var(--text-muted)",
                    border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
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
                { key: "evidence", label: "", width: "60px" },
              ].map(({ key, label, sortable, hideOnMobile, width }) => (
                <th
                  key={key}
                  className={`text-left text-xs font-semibold uppercase tracking-wider ${hideOnMobile ? "hidden md:table-cell" : ""}`}
                  style={{
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border-color)",
                    padding: "12px 16px",
                    width: width || "auto",
                  }}
                >
                  {sortable ? (
                    <button
                      onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                      className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      {label}
                      {sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  ) : label}
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
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="group cursor-pointer transition-colors duration-100"
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-raised)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <td className="whitespace-nowrap text-sm" style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>
                    {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="text-sm font-medium font-mono" style={{ color: "var(--text-primary)" }}>
                      {entry.model_name}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold" style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                      {entry.model_version}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <DecisionBadge decision={entry.decision} />
                  </td>
                  <td className="hidden md:table-cell" style={{ padding: "14px 16px" }}>
                    <p className="text-sm leading-relaxed max-w-xl line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {entry.rationale}
                    </p>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150" style={{ color: "var(--text-muted)" }}>
                      <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity duration-150" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--border-color)" }}>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Evidence Drawer ───────────────────────────────────── */}
      <EvidenceDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </>
  );
}
