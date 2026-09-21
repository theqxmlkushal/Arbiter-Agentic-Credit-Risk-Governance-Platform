"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme-context";
import { ModeProvider } from "@/lib/mode-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ModeProvider>{children}</ModeProvider>
    </ThemeProvider>
  );
}
