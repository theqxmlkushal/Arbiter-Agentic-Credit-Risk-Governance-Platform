import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DecisionBadge } from "@/components/decisions/DecisionBadge";

describe("DecisionBadge", () => {
  it("renders Promote with green styling", () => {
    render(<DecisionBadge decision="promote" />);
    expect(screen.getByText("Promote")).toBeInTheDocument();
  });

  it("renders Reject with red styling", () => {
    render(<DecisionBadge decision="reject" />);
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("renders Review with amber styling", () => {
    render(<DecisionBadge decision="human_review" />);
    expect(screen.getByText("Review")).toBeInTheDocument();
  });
});
