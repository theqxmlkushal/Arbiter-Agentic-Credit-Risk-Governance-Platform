"use client";

import type { ReactNode } from "react";
import { Providers } from "./Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen" style={{ background: "var(--surface)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto animated-gradient">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
