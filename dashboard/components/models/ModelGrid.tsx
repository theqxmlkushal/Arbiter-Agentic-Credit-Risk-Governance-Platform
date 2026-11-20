"use client";

import { useState, useMemo } from "react";
import { ModelCard } from "./ModelCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, X } from "lucide-react";
import type { ModelVersion } from "@/lib/mock-data";

const STAGE_FILTERS = ["all", "Production", "Staging", "Archived"] as const;

export function ModelGrid({ models }: { models: ModelVersion[] }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const stageCounts = useMemo(
    () => ({
      all: models.length,
      Production: models.filter((m) => m.stage === "Production").length,
      Staging: models.filter((m) => m.stage === "Staging").length,
      Archived: models.filter((m) => m.stage === "Archived").length,
    }),
    [models]
  );

  const filtered = useMemo(() => {
    let result = models;
    if (stageFilter !== "all") result = result.filter((m) => m.stage === stageFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          String(m.version).includes(q)
      );
    }
    return result;
  }, [models, search, stageFilter]);

  if (models.length === 0) {
    return (
      <EmptyState
        title="No models registered"
        description="Model cards appear here after the first training run registers a model in MLflow."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Segmented Stage Filter Bar */}
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border glass-card"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
      >
        {/* Search input with left-3 slot and pl-10 h-11 */}
        <div className="relative flex-1 max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10">
            <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models by name or version..."
            className="w-full pl-10 pr-9 h-11 rounded-xl text-sm outline-none transition-all duration-150 border focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center hover:opacity-75 cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Control: gap-2 and px-3 py-1.5, spaced count badges */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto scrollbar-none"
          style={{ background: "var(--surface-overlay)", borderColor: "var(--border-color)" }}
          role="tablist"
        >
          {STAGE_FILTERS.map((f) => {
            const active = stageFilter === f;
            const count = stageCounts[f as keyof typeof stageCounts] || 0;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={active}
                onClick={() => setStageFilter(f)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer shrink-0 select-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                <span>{f === "all" ? "All Stages" : f}</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1"
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

      {/* Grid with exact gutter: grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching models"
          description={`No models found matching "${search}" in the selected stage.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((model, i) => (
            <ModelCard key={`${model.name}-${model.version}`} model={model} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
