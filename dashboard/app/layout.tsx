import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arbiter — Governance Dashboard",
  description: "Credit-risk model governance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-mode="telemetry" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
