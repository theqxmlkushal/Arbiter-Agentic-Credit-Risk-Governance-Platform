"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ViewMode = "telemetry" | "auditor";

interface ModeContextType {
  mode: ViewMode;
  toggle: () => void;
}

const ModeContext = createContext<ModeContextType>({ mode: "telemetry", toggle: () => {} });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("telemetry");

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "telemetry" ? "auditor" : "telemetry"));

  return <ModeContext.Provider value={{ mode, toggle }}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
