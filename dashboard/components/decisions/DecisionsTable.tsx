"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
  X,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { DecisionBadge } from "./DecisionBadge";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import type { AuditLogEntry } from "@/lib/mock-data";

const PAGE_SIZE = 10;

export function DecisionsTable({
  data,
  isLoading = false,
}: {
  data: AuditLogEntry[];
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Dynamic counts for segmented control
  const counts = useMemo(
    () => ({
      all: data.length,
      promote: data.filter((r) => r.decision === "promote").length,
      reject: data.filter((r) => r.decision === "reject").length,
      human_review: data.filter((r) => r.decision === "human_review").length,
    }),
    [data]
  );

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

  if (!isLoading && data.length === 0) {
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
      <div
        className="p-5 space-y-4 border-b transition-colors duration-150"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search box with absolute left-3 slot and pl-10 h-11 */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10">
              <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by model, version, or rationale..."
              className="w-full pl-10 pr-9 h-11 rounded-xl text-sm outline-none transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(0);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center hover:opacity-75 cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Control for Filters: gap-2 and px-3 py-1.5 */}
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto scrollbar-none"
            style={{
              background: "var(--surface-overlay)",
              borderColor: "var(--border-color)",
            }}
            role="tablist"
            aria-label="Filter decisions by verdict"
          >
            {[
              { key: "all", label: "All", count: counts.all },
              { key: "promote", label: "Promoted", count: counts.promote, icon: CheckCircle2, color: "var(--color-success)" },
              { key: "reject", label: "Rejected", count: counts.reject, icon: XCircle, color: "var(--color-danger)" },
              { key: "human_review", label: "Review", count: counts.human_review, icon: AlertTriangle, color: "var(--color-warning)" },
            ].map(({ key, label, count, icon: Icon, color }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setFilter(key);
                    setPage(0);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer shrink-0 select-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#ffffff" : "var(--text-secondary)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? "white" : color }} />}
                  <span>{label}</span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-0.5"
                    style={{
                      background: active ? "rgba(255,255,255,0.22)" : "var(--surface-raised)",
                      color: active ? "white" : "var(--text-muted)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Small hint with icon, mt-2, separated from toolbar, record count on right */}
        <div className="flex items-center justify-between text-xs mt-2 pt-1 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Click any row to open the complete evidence bundle drawer</span>
          </div>
          <span>
            <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Mobile Responsive Card View (< md) ───────────────── */}
      <div className="md:hidden p-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            title="No matching decisions"
            description="No audit records matched your query or filter criteria."
          />
        ) : (
          paged.map((entry) => (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedEntry(entry)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedEntry(entry);
                }
              }}
              className="p-4 rounded-xl border transition-all duration-150 cursor-pointer hover:shadow-sm space-y-2.5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                    {entry.model_name}
                  </span>
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                  >
                    v{entry.model_version}
                  </span>
                </div>
                <DecisionBadge decision={entry.decision} />
              </div>

              <p
                className="text-xs leading-relaxed line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
                title={entry.rationale}
              >
                {entry.rationale}
              </p>

              <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                <span className="font-mono">
                  {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-indigo-400 font-medium">
                  View Bundle <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Desktop & Tablet Table (>= md) ──────────────────── */}
      <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No matching decisions"
              description="No audit records matched your search query or verdict filter."
            />
          </div>
        ) : (
          <table className="w-full text-left" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10 shadow-2xs" style={{ background: "var(--surface-raised)" }}>
              <tr className="h-12 border-b" style={{ borderColor: "var(--border-color)" }}>
                {[
                  { key: "time", label: "Date & Time", sortable: true, width: "w-[140px] min-w-[140px]" },
                  { key: "model", label: "Model Asset", width: "w-[200px] min-w-[200px]" },
                  { key: "version", label: "Version", width: "w-[90px] min-w-[90px]" },
                  { key: "decision", label: "Verdict", width: "w-[130px] min-w-[130px]" },
                  { key: "rationale", label: "Compliance & Risk Rationale", width: "min-w-[240px]" },
                  { key: "evidence", label: "", width: "w-[56px] min-w-[56px]" },
                ].map(({ key, label, sortable, width }) => (
                  <th
                    key={key}
                    className={`text-xs font-bold uppercase tracking-wider px-4 py-3 ${width}`}
                    style={{
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    {sortable ? (
                      <button
                        onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group focus-visible:ring-2 focus-visible:ring-indigo-500 rounded outline-none"
                        aria-label="Sort by timestamp"
                      >
                        <span>{label}</span>
                        <span className="p-0.5 rounded group-hover:bg-slate-500/10">
                          {sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </span>
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect evidence for ${entry.model_name} version ${entry.model_version}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.15 }}
                    className="group cursor-pointer transition-colors duration-150 border-b select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
                    style={{ borderColor: "var(--border-subtle)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-raised)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => setSelectedEntry(entry)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedEntry(entry);
                      }
                    }}
                  >
                    {/* Fixed Date Column: 140px */}
                    <td
                      className="whitespace-nowrap text-xs font-mono px-4 py-4 w-[140px] min-w-[140px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(entry.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Model Asset Column: 200px */}
                    <td className="px-4 py-4 w-[200px] min-w-[200px]">
                      <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                        {entry.model_name}
                      </span>
                    </td>

                    {/* Fixed Version Column: 90px */}
                    <td className="px-4 py-4 w-[90px] min-w-[90px]">
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-mono font-bold border shadow-2xs"
                        style={{
                          background: "var(--accent-muted)",
                          color: "var(--accent)",
                          borderColor: "var(--border-color)",
                        }}
                      >
                        v{entry.model_version}
                      </span>
                    </td>

                    {/* Fixed Verdict Column: 130px */}
                    <td className="px-4 py-4 w-[130px] min-w-[130px]">
                      <DecisionBadge decision={entry.decision} />
                    </td>

                    {/* Rationale Column (14px, line-clamp-2, hover tooltip) */}
                    <td className="px-4 py-4">
                      <p
                        className="text-sm leading-relaxed max-w-xl line-clamp-2"
                        style={{ color: "var(--text-secondary)" }}
                        title={entry.rationale}
                      >
                        {entry.rationale}
                      </p>
                    </td>

                    {/* Action/Chevron Column: 56px */}
                    <td className="px-4 py-4 w-[56px] min-w-[56px] text-center">
                      <button
                        type="button"
                        aria-label="Open evidence drawer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center border transition-all duration-150 group-hover:scale-105 group-hover:bg-slate-500/10 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--accent)",
                        }}
                        title="Open evidence drawer"
                      >
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-6 py-3.5 border-t transition-colors duration-150"
          style={{ borderColor: "var(--border-color)", background: "var(--surface-raised)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Page <strong style={{ color: "var(--text-primary)" }}>{page + 1}</strong> of <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
              aria-label="Next page"
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
