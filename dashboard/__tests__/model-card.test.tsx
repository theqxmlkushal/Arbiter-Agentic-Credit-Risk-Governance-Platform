import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ModelCard } from "@/components/models/ModelCard";
import { MOCK_MODELS } from "@/lib/mock-data";

describe("ModelCard", () => {
  it("renders model name and version", () => {
    render(<ModelCard model={MOCK_MODELS[0]} index={0} />);
    expect(screen.getByText("credit_champion")).toBeInTheDocument();
    expect(screen.getByText(/v7/)).toBeInTheDocument();
  });

  it("shows stage badge", () => {
    render(<ModelCard model={MOCK_MODELS[0]} index={0} />);
    expect(screen.getByText("Production")).toBeInTheDocument();
  });

  it("displays metrics", () => {
    render(<ModelCard model={MOCK_MODELS[0]} index={0} />);
    expect(screen.getByText("0.847")).toBeInTheDocument();
    expect(screen.getByText("0.694")).toBeInTheDocument();
    expect(screen.getByText("0.028")).toBeInTheDocument();
  });
});
