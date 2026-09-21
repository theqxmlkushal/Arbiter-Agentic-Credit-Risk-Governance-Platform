import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DecisionsTable } from "@/components/decisions/DecisionsTable";
import { MOCK_AUDIT_LOG } from "@/lib/mock-data";

// Mock the mode context
vi.mock("@/lib/mode-context", () => ({
  useMode: () => ({ mode: "auditor", toggle: vi.fn() }),
  ModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("DecisionsTable", () => {
  it("renders rows for each audit log entry", () => {
    render(<DecisionsTable data={MOCK_AUDIT_LOG} />);
    // Check that model names appear
    expect(screen.getAllByText("credit_champion").length).toBeGreaterThan(0);
  });

  it("shows empty state when data is empty", () => {
    render(<DecisionsTable data={[]} />);
    expect(screen.getByText("No governance decisions")).toBeInTheDocument();
  });

  it("renders decision badges", () => {
    render(<DecisionsTable data={MOCK_AUDIT_LOG} />);
    expect(screen.getAllByText("Promote").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reject").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Review").length).toBeGreaterThan(0);
  });
});
