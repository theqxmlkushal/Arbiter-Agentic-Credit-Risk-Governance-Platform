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

  const filtered = useMemo(() => {
    let result = models;
    if (stageFilter !== "all")
      result = result.filter((m) => m.stage === stageFilter);
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
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            style={{
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Stage filter pills */}
        <div className="flex items-center gap-2">
          {STAGE_FILTERS.map((f) => {
            const active = stageFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStageFilter(f)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "white" : "var(--text-muted)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-strong)"}`,
                }}
              >
                {f === "all" ? "All" : f}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <div className="hidden sm:flex items-center ml-auto">
          <span className="text-sm pl-2" style={{ color: "var(--text-muted)" }}>
            {filtered.length} model{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((model, i) => (
          <ModelCard
            key={`${model.name}-${model.version}`}
            model={model}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
