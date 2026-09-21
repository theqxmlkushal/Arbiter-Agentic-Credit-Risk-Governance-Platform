// ─── Mock Data for Phase 13 Dashboard ────────────────────────────────────────
// All data is realistic and matches the Arbiter governance pipeline output.

export interface AuditLogEntry {
  id: string;
  model_name: string;
  model_version: number;
  decision: "promote" | "reject" | "human_review";
  rationale: string;
  evidence: {
    validation: {
      performance: { roc_auc: number; gini: number };
      fairness: { demographic_parity_difference: number; equalized_odds_difference: number };
      calibration: number;
      passed_hard_constraints: boolean;
    };
    drift: {
      drifted_features: string[];
      dataset_drift: boolean;
    };
    policy_verdict: string;
  };
  created_at: string;
}

export interface ModelVersion {
  name: string;
  version: number;
  stage: "Production" | "Staging" | "Archived" | "None";
  run_id: string;
  metrics: { roc_auc: number; gini: number; ece: number };
  created_at: string;
  description: string;
}

export interface DriftSnapshot {
  id: string;
  model_name: string;
  created_at: string;
  drifted_features: string[];
  dataset_drift: boolean;
  demographic_parity_diff: number;
  equalized_odds_diff: number;
  roc_auc: number;
  num_drifted: number;
}

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "a1",
    model_name: "credit_champion",
    model_version: 7,
    decision: "promote",
    rationale:
      "Model v7 achieved ROC-AUC of 0.847 (+3.2% over champion v6) with demographic parity difference of 0.042, well within the 0.10 threshold. Calibration error (ECE=0.028) confirms reliable probability estimates. All hard constraints satisfied.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.847, gini: 0.694 },
        fairness: { demographic_parity_difference: 0.042, equalized_odds_difference: 0.031 },
        calibration: 0.028,
        passed_hard_constraints: true,
      },
      drift: { drifted_features: [], dataset_drift: false },
      policy_verdict: "pass",
    },
    created_at: "2024-12-15T14:23:00Z",
  },
  {
    id: "a2",
    model_name: "credit_champion",
    model_version: 6,
    decision: "promote",
    rationale:
      "Candidate v6 demonstrates solid improvement over v5 with AUC 0.821 vs 0.798. Fairness metrics within bounds. Recommend promotion to Production after canary validation.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.821, gini: 0.642 },
        fairness: { demographic_parity_difference: 0.068, equalized_odds_difference: 0.055 },
        calibration: 0.035,
        passed_hard_constraints: true,
      },
      drift: { drifted_features: ["credit_utilization"], dataset_drift: false },
      policy_verdict: "pass",
    },
    created_at: "2024-11-28T09:15:00Z",
  },
  {
    id: "a3",
    model_name: "credit_champion",
    model_version: 5,
    decision: "reject",
    rationale:
      "Model v5 failed the fairness hard constraint. Demographic parity difference of 0.127 exceeds the 0.10 threshold. The model shows bias against the protected group in the 620-680 credit score band. Retraining with fairness-aware algorithm recommended.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.812, gini: 0.624 },
        fairness: { demographic_parity_difference: 0.127, equalized_odds_difference: 0.089 },
        calibration: 0.041,
        passed_hard_constraints: false,
      },
      drift: { drifted_features: ["annual_income", "debt_to_income"], dataset_drift: true },
      policy_verdict: "fail",
    },
    created_at: "2024-11-10T16:42:00Z",
  },
  {
    id: "a4",
    model_name: "credit_champion",
    model_version: 4,
    decision: "human_review",
    rationale:
      "Borderline case: AUC 0.761 barely exceeds minimum threshold of 0.75. Calibration error (ECE=0.047) is near the 0.05 limit. While technically passing, recommend human reviewer assess whether marginal performance justifies deployment risk.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.761, gini: 0.522 },
        fairness: { demographic_parity_difference: 0.088, equalized_odds_difference: 0.071 },
        calibration: 0.047,
        passed_hard_constraints: true,
      },
      drift: { drifted_features: ["employment_length_years"], dataset_drift: false },
      policy_verdict: "review",
    },
    created_at: "2024-10-22T11:08:00Z",
  },
  {
    id: "a5",
    model_name: "credit_champion",
    model_version: 3,
    decision: "reject",
    rationale:
      "Model v3 shows significant performance regression. ROC-AUC of 0.718 falls below the 0.75 hard constraint. Additionally, dataset drift detected in 3 features (annual_income, credit_score, debt_to_income). Root cause: training data staleness — cutoff date too old.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.718, gini: 0.436 },
        fairness: { demographic_parity_difference: 0.095, equalized_odds_difference: 0.067 },
        calibration: 0.052,
        passed_hard_constraints: false,
      },
      drift: { drifted_features: ["annual_income", "credit_score", "debt_to_income"], dataset_drift: true },
      policy_verdict: "fail",
    },
    created_at: "2024-10-05T08:30:00Z",
  },
  {
    id: "a6",
    model_name: "credit_champion",
    model_version: 2,
    decision: "promote",
    rationale:
      "Initial champion candidate. v2 shows meaningful improvement over v1 baseline with AUC 0.789. Fairness metrics acceptable. Recommend promotion.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.789, gini: 0.578 },
        fairness: { demographic_parity_difference: 0.073, equalized_odds_difference: 0.058 },
        calibration: 0.039,
        passed_hard_constraints: true,
      },
      drift: { drifted_features: [], dataset_drift: false },
      policy_verdict: "pass",
    },
    created_at: "2024-09-18T13:55:00Z",
  },
  {
    id: "a7",
    model_name: "credit_champion",
    model_version: 1,
    decision: "human_review",
    rationale:
      "First model in the registry. No baseline to compare against. All hard constraints technically met but insufficient history for automated promotion. Recommend human review before production deployment.",
    evidence: {
      validation: {
        performance: { roc_auc: 0.764, gini: 0.528 },
        fairness: { demographic_parity_difference: 0.082, equalized_odds_difference: 0.061 },
        calibration: 0.044,
        passed_hard_constraints: true,
      },
      drift: { drifted_features: [], dataset_drift: false },
      policy_verdict: "review",
    },
    created_at: "2024-09-01T10:00:00Z",
  },
];

export const MOCK_MODELS: ModelVersion[] = [
  { name: "credit_champion", version: 7, stage: "Production", run_id: "run_a1b2c3", metrics: { roc_auc: 0.847, gini: 0.694, ece: 0.028 }, created_at: "2024-12-15", description: "LightGBM with fairness constraints" },
  { name: "credit_champion", version: 6, stage: "Archived", run_id: "run_d4e5f6", metrics: { roc_auc: 0.821, gini: 0.642, ece: 0.035 }, created_at: "2024-11-28", description: "XGBoost baseline" },
  { name: "credit_champion", version: 5, stage: "Archived", run_id: "run_g7h8i9", metrics: { roc_auc: 0.812, gini: 0.624, ece: 0.041 }, created_at: "2024-11-10", description: "Rejected: fairness violation" },
  { name: "credit_champion", version: 4, stage: "Archived", run_id: "run_j0k1l2", metrics: { roc_auc: 0.761, gini: 0.522, ece: 0.047 }, created_at: "2024-10-22", description: "Borderline — sent to human review" },
  { name: "credit_champion", version: 3, stage: "Archived", run_id: "run_m3n4o5", metrics: { roc_auc: 0.718, gini: 0.436, ece: 0.052 }, created_at: "2024-10-05", description: "Rejected: below AUC threshold" },
  { name: "credit_champion", version: 2, stage: "Archived", run_id: "run_p6q7r8", metrics: { roc_auc: 0.789, gini: 0.578, ece: 0.039 }, created_at: "2024-09-18", description: "First promoted model" },
  { name: "credit_champion", version: 1, stage: "Archived", run_id: "run_s9t0u1", metrics: { roc_auc: 0.764, gini: 0.528, ece: 0.044 }, created_at: "2024-09-01", description: "Initial baseline model" },
];

export const MOCK_DRIFT_SNAPSHOTS: DriftSnapshot[] = [
  { id: "d1", model_name: "credit_champion", created_at: "2024-12-15", drifted_features: [], dataset_drift: false, demographic_parity_diff: 0.042, equalized_odds_diff: 0.031, roc_auc: 0.847, num_drifted: 0 },
  { id: "d2", model_name: "credit_champion", created_at: "2024-12-01", drifted_features: [], dataset_drift: false, demographic_parity_diff: 0.051, equalized_odds_diff: 0.038, roc_auc: 0.844, num_drifted: 0 },
  { id: "d3", model_name: "credit_champion", created_at: "2024-11-15", drifted_features: ["credit_utilization"], dataset_drift: false, demographic_parity_diff: 0.065, equalized_odds_diff: 0.049, roc_auc: 0.835, num_drifted: 1 },
  { id: "d4", model_name: "credit_champion", created_at: "2024-11-01", drifted_features: ["credit_utilization", "employment_length_years"], dataset_drift: false, demographic_parity_diff: 0.072, equalized_odds_diff: 0.055, roc_auc: 0.828, num_drifted: 2 },
  { id: "d5", model_name: "credit_champion", created_at: "2024-10-15", drifted_features: ["annual_income", "debt_to_income", "credit_utilization"], dataset_drift: true, demographic_parity_diff: 0.098, equalized_odds_diff: 0.073, roc_auc: 0.812, num_drifted: 3 },
  { id: "d6", model_name: "credit_champion", created_at: "2024-10-01", drifted_features: ["annual_income", "credit_score"], dataset_drift: true, demographic_parity_diff: 0.112, equalized_odds_diff: 0.085, roc_auc: 0.798, num_drifted: 2 },
  { id: "d7", model_name: "credit_champion", created_at: "2024-09-15", drifted_features: [], dataset_drift: false, demographic_parity_diff: 0.073, equalized_odds_diff: 0.058, roc_auc: 0.789, num_drifted: 0 },
  { id: "d8", model_name: "credit_champion", created_at: "2024-09-01", drifted_features: [], dataset_drift: false, demographic_parity_diff: 0.082, equalized_odds_diff: 0.061, roc_auc: 0.764, num_drifted: 0 },
];
