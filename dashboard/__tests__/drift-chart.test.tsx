import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DriftChart } from "@/components/drift/DriftChart";

describe("DriftChart", () => {
  it("renders empty state when no snapshots", () => {
    render(<DriftChart snapshots={[]} />);
    expect(screen.getByText("No drift data yet")).toBeInTheDocument();
  });

  it("renders a chart container when data exists", () => {
    const mockSnapshots = [
      {
        id: "d1",
        model_name: "credit_champion",
        created_at: "2024-12-15",
        drifted_features: [],
        dataset_drift: false,
        demographic_parity_diff: 0.042,
        equalized_odds_diff: 0.031,
        roc_auc: 0.847,
        num_drifted: 0,
      },
    ];
    const { container } = render(<DriftChart snapshots={mockSnapshots} />);
    // Recharts renders a responsive container div
    const chartContainer = container.querySelector(".recharts-responsive-container");
    expect(chartContainer).toBeInTheDocument();
  });
});
