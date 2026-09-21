"use client";

import { useState, useMemo } from "react";
import { ModelCard } from "./ModelCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ModelVersion } from "@/lib/mock-data";

export function ModelGrid({ models }: { models: ModelVersion[] }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

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
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex-1 w-full sm:max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search models..." />
        </div>
        <div className="flex items-center gap-2">
          {["all", "Production", "Staging", "Archived"].map((f) => (
            <button
              key={f}
              onClick={() => setStageFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: stageFilter === f ? "var(--accent)" : "var(--input-bg)",
                color: stageFilter === f ? "white" : "var(--text-secondary)",
              }}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((model, i) => (
          <ModelCard key={`${model.name}-${model.version}`} model={model} index={i} />
        ))}
      </div>
    </>
  );
}
