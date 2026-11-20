/**
 * ui-helpers.ts
 * Design-token–level metric thresholds and status utilities.
 * Used across all pages to ensure consistent semantic color coding.
 *
 * THRESHOLDS (per STEP 1 spec):
 *   AUC   : fail < 0.75  | warn 0.75–<0.80 | pass ≥ 0.80
 *   ECE   : fail > 0.05  | warn 0.04–0.05  | pass ≤ 0.04
 *   Parity: fail > 0.10  | warn 0.08–0.10  | pass < 0.08
 *   GINI  : neutral (no policy threshold)
 */

export const METRIC_THRESHOLDS = {
  auc: { pass: 0.8, warn: 0.75 },        // fail < 0.75
  ece: { pass: 0.04, warn: 0.05 },       // fail > 0.05
  parity: { pass: 0.08, warn: 0.10 },   // fail > 0.10
} as const;

export type MetricStatus = "pass" | "warn" | "fail" | "neutral";
export type MetricKey = "auc" | "ece" | "parity" | "gini";

/**
 * Returns pass | warn | fail | neutral for a given metric value.
 * Use this everywhere a colour decision depends on a metric value.
 */
export function getMetricStatus(metric: MetricKey, value: number): MetricStatus {
  if (metric === "gini") return "neutral";

  if (metric === "auc") {
    if (value >= METRIC_THRESHOLDS.auc.pass) return "pass";
    if (value >= METRIC_THRESHOLDS.auc.warn) return "warn";
    return "fail";
  }

  if (metric === "ece") {
    if (value <= METRIC_THRESHOLDS.ece.pass) return "pass";
    if (value <= METRIC_THRESHOLDS.ece.warn) return "warn";
    return "fail";
  }

  // parity / equalized odds / demographic parity diff
  if (value < METRIC_THRESHOLDS.parity.pass) return "pass";
  if (value <= METRIC_THRESHOLDS.parity.warn) return "warn";
  return "fail";
}

/**
 * Maps a MetricStatus to CSS variable strings for color, background, and border.
 * Returns inline-style-safe strings referencing design tokens from globals.css.
 */
export function getStatusColor(status: MetricStatus): {
  color: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case "pass":
      return {
        color: "var(--color-success)",
        bg: "var(--color-success-bg)",
        border: "var(--color-success-border)",
      };
    case "warn":
      return {
        color: "var(--color-warning)",
        bg: "var(--color-warning-bg)",
        border: "var(--color-warning-border)",
      };
    case "fail":
      return {
        color: "var(--color-danger)",
        bg: "var(--color-danger-bg)",
        border: "var(--color-danger-border)",
      };
    case "neutral":
    default:
      return {
        color: "var(--text-muted)",
        bg: "var(--surface-raised)",
        border: "var(--border-color)",
      };
  }
}
