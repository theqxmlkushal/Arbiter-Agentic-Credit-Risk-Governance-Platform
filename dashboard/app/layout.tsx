"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/lib/theme-context";
import { ModeProvider } from "@/lib/mode-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Arbiter — Governance Dashboard</title>
        <meta name="description" content="Credit-risk model governance dashboard" />
      </head>
      <body>
        <ThemeProvider>
          <ModeProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 animated-gradient">{children}</main>
              </div>
            </div>
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
