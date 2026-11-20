"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  FileCheck,
  LayoutDashboard,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DecisionBadge } from "./DecisionBadge";
import type { AuditLogEntry } from "@/lib/mock-data";
import { getMetricStatus, getStatusColor } from "@/lib/ui-helpers";

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
    if (value.length === 0) return <span>[]</span>;
    return (
      <span>
        [{"\n"}
        {value.map((v, i) => (
          <span key={i} className="pl-4 block">
            <JsonValue value={v} />
            {i < value.length - 1 ? "," : ""}
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
          <span key={k} className="pl-4 block">
            <span style={{ color: "var(--json-key)" }}>&quot;{k}&quot;</span>:{" "}
            <JsonValue value={v} />
            {i < entries.length - 1 ? "," : ""}
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
  const [activeTab, setActiveTab] = useState<"overview" | "json">("overview");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (entry) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [entry, onClose]);

  const handleCopy = () => {
    if (entry) {
      navigator.clipboard.writeText(JSON.stringify(entry.evidence, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!entry) return null;

  const { validation, drift, policy_verdict } = entry.evidence;

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Panel: 480px wide, blurred backdrop overlay */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] flex flex-col shadow-2xl border-l"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5 border-b backdrop-blur-md sticky top-0 z-10"
              style={{
                background: "var(--header-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs shrink-0"
                  style={{
                    background: "var(--accent-muted)",
                    borderColor: "var(--border-color)",
                    color: "var(--accent)",
                  }}
                >
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="evidence-drawer-title" className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                      Evidence Bundle
                    </h3>
                    <DecisionBadge decision={entry.decision} />
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {entry.model_name} · v{entry.model_version}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border transition-colors duration-150 hover:bg-slate-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                  title="Copy Evidence JSON"
                  aria-label="Copy Evidence JSON"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border transition-colors duration-150 hover:bg-slate-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                  title="Close (Esc)"
                  aria-label="Close Evidence Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Header Tabs */}
            <div
              className="flex items-center gap-2 px-5 py-2.5 border-b text-xs font-semibold"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-color)",
              }}
            >
              <button
                onClick={() => setActiveTab("overview")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                style={{
                  background: activeTab === "overview" ? "var(--accent)" : "transparent",
                  color: activeTab === "overview" ? "white" : "var(--text-muted)",
                }}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Auditor Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                style={{
                  background: activeTab === "json" ? "var(--accent)" : "transparent",
                  color: activeTab === "json" ? "white" : "var(--text-muted)",
                }}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw Evidence JSON</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === "overview" ? (
                <>
                  {/* Metadata Row Card */}
                  <div
                    className="p-3.5 rounded-xl border grid grid-cols-2 gap-3 text-xs"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Decision ID</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{entry.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Logged At</span>
                      <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Executive Rationale Card */}
                  <div
                    className="p-4 rounded-xl border space-y-2"
                    style={{
                      background: "var(--surface-raised)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Governance Verdict Rationale
                      </span>
                      <span
                        className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            policy_verdict === "pass"
                              ? "var(--badge-promote-bg)"
                              : policy_verdict === "fail"
                              ? "var(--badge-reject-bg)"
                              : "var(--badge-review-bg)",
                          color:
                            policy_verdict === "pass"
                              ? "var(--color-success)"
                              : policy_verdict === "fail"
                              ? "var(--color-danger)"
                              : "var(--color-warning)",
                        }}
                      >
                        Verdict: {policy_verdict}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {entry.rationale}
                    </p>
                  </div>

                  {/* Validation Hard Constraints Banner */}
                  <div
                    className="flex items-center justify-between p-3.5 rounded-xl border"
                    style={{
                      background: validation.passed_hard_constraints
                        ? "var(--color-success-bg)"
                        : "var(--color-danger-bg)",
                      borderColor: validation.passed_hard_constraints
                        ? "var(--color-success-border)"
                        : "var(--color-danger-border)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      {validation.passed_hard_constraints ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{
                            color: validation.passed_hard_constraints
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                          }}
                        >
                          Hard Constraints: {validation.passed_hard_constraints ? "Satisfied" : "Violated"}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {validation.passed_hard_constraints
                            ? "All strict policy boundaries passed without exception."
                            : "One or more regulatory risk bounds breached."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Model Performance Scores — colored via getMetricStatus */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Validation Performance
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {(() => {
                        const aucStatus = getMetricStatus("auc", validation.performance.roc_auc);
                        const giniStatus = getMetricStatus("gini", validation.performance.gini);
                        const eceStatus = getMetricStatus("ece", validation.calibration);
                        const aucSc = getStatusColor(aucStatus);
                        const giniSc = getStatusColor(giniStatus);
                        const eceSc = getStatusColor(eceStatus);
                        return (
                          <>
                            <div
                              className="p-3 rounded-xl border text-center"
                              style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                            >
                              <p className="text-[10px] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
                                ROC-AUC
                              </p>
                              <p className="text-base font-bold font-mono mt-0.5" style={{ color: aucSc.color }}>
                                {validation.performance.roc_auc.toFixed(3)}
                              </p>
                              <p className="text-[9px] mt-0.5 text-slate-400">Min: 0.750</p>
                            </div>

                            <div
                              className="p-3 rounded-xl border text-center"
                              style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                            >
                              <p className="text-[10px] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
                                Gini Index
                              </p>
                              <p className="text-base font-bold font-mono mt-0.5" style={{ color: giniSc.color }}>
                                {validation.performance.gini.toFixed(3)}
                              </p>
                              <p className="text-[9px] mt-0.5 text-slate-400">Discrimination</p>
                            </div>

                            <div
                              className="p-3 rounded-xl border text-center"
                              style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                            >
                              <p className="text-[10px] uppercase font-mono" style={{ color: "var(--text-muted)" }}>
                                ECE (Calib)
                              </p>
                              <p className="text-base font-bold font-mono mt-0.5" style={{ color: eceSc.color }}>
                                {validation.calibration.toFixed(3)}
                              </p>
                              <p className="text-[9px] mt-0.5 text-slate-400">Max: 0.050</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Fairness & Parity Checks with proper ≤ — colored via getMetricStatus */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Fairness & Parity Checks
                      </p>
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                        Threshold ≤ 0.1000
                      </span>
                    </div>

                    <div
                      className="p-4 rounded-xl border space-y-3"
                      style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                    >
                      {/* DPD */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "var(--text-secondary)" }}>Demographic Parity Diff (DPD)</span>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: getStatusColor(getMetricStatus("parity", validation.fairness.demographic_parity_difference)).color }}
                          >
                            {validation.fairness.demographic_parity_difference.toFixed(4)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden bg-slate-500/15">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (validation.fairness.demographic_parity_difference / 0.15) * 100)}%`,
                              background: getStatusColor(getMetricStatus("parity", validation.fairness.demographic_parity_difference)).color,
                            }}
                          />
                        </div>
                      </div>

                      {/* EOD */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "var(--text-secondary)" }}>Equalized Odds Diff (EOD)</span>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: getStatusColor(getMetricStatus("parity", validation.fairness.equalized_odds_difference)).color }}
                          >
                            {validation.fairness.equalized_odds_difference.toFixed(4)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden bg-slate-500/15">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (validation.fairness.equalized_odds_difference / 0.15) * 100)}%`,
                              background: getStatusColor(getMetricStatus("parity", validation.fairness.equalized_odds_difference)).color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drift Analysis */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Dataset & Feature Drift
                    </p>
                    <div
                      className="p-4 rounded-xl border space-y-2.5"
                      style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Dataset Level Drift:
                        </span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: drift.dataset_drift ? "var(--badge-reject-bg)" : "var(--badge-promote-bg)",
                            color: drift.dataset_drift ? "var(--color-danger)" : "var(--color-success)",
                          }}
                        >
                          {drift.dataset_drift ? "Drift Detected" : "Stable (No Drift)"}
                        </span>
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          Drifted Features ({drift.drifted_features.length}):
                        </span>
                        {drift.drifted_features.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {drift.drifted_features.map((feat) => (
                              <span
                                key={feat}
                                className="text-[11px] font-mono px-2 py-0.5 rounded-md border"
                                style={{
                                  background: "var(--badge-reject-bg)",
                                  color: "var(--color-danger)",
                                  borderColor: "var(--badge-reject-border)",
                                }}
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-emerald-500 mt-1">
                            ✓ All feature distributions conform to reference baseline.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regulatory Audit Checkpoint Timeline */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Audit Checkpoint Timeline
                    </p>
                    <div
                      className="p-4 rounded-xl border space-y-3.5"
                      style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
                    >
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-500/20">
                        {/* Checkpoint 1: Model Candidate Registered */}
                        <div className="relative">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            Model Registered
                          </p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {entry.model_name} (v{entry.model_version}) candidate initiated
                          </p>
                        </div>

                        {/* Checkpoint 2: Policy Boundary Validation */}
                        <div className="relative">
                          <div
                            className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                              validation.passed_hard_constraints
                                ? "bg-emerald-500 ring-emerald-500/20"
                                : "bg-red-500 ring-red-500/20"
                            }`}
                          />
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            Policy Boundary Evaluation
                          </p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Hard constraints {validation.passed_hard_constraints ? "passed" : "breached"} · ROC-AUC {validation.performance.roc_auc.toFixed(3)}
                          </p>
                        </div>

                        {/* Checkpoint 3: Fairness & Distribution Surveillance */}
                        <div className="relative">
                          <div
                            className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                              drift.dataset_drift
                                ? "bg-amber-500 ring-amber-500/20"
                                : "bg-emerald-500 ring-emerald-500/20"
                            }`}
                          />
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            Fairness & Drift Surveillance
                          </p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                            DPD {validation.fairness.demographic_parity_difference.toFixed(4)} · {drift.drifted_features.length} drifted
                          </p>
                        </div>

                        {/* Checkpoint 4: Final Governance Verdict */}
                        <div className="relative">
                          <div
                            className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                              policy_verdict === "pass"
                                ? "bg-emerald-500 ring-emerald-500/20"
                                : policy_verdict === "fail"
                                ? "bg-red-500 ring-red-500/20"
                                : "bg-amber-500 ring-amber-500/20"
                            }`}
                          />
                          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            Verdict Recorded: {entry.decision.toUpperCase()}
                          </p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Raw JSON Viewer */
                <div className="relative">
                  <pre
                    className="text-xs leading-relaxed font-mono p-4 rounded-xl overflow-x-auto border"
                    style={{
                      background: "var(--input-bg)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <JsonValue value={entry.evidence} />
                  </pre>
                </div>
              )}
            </div>

            {/* Footer with Timestamp */}
            <div
              className="p-4 border-t flex items-center justify-between text-xs"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-color)",
                color: "var(--text-muted)",
              }}
            >
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Timestamp: {new Date(entry.created_at).toUTCString()}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
