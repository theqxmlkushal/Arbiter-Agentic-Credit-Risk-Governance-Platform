"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Scale, FileText, Box, Activity } from "lucide-react";

const NAV_ITEMS = [
  { href: "/decisions", label: "Decisions", icon: FileText, tag: "AUDIT" },
  { href: "/models", label: "Models", icon: Box, tag: "REGISTRY" },
  { href: "/drift", label: "Drift", icon: Activity, tag: "FAIRNESS" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-[72px] lg:w-[260px] lg:min-w-[260px] h-screen sticky top-0 select-none z-30 transition-[width] duration-200 px-3 py-4"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Brand Header */}
      <Link
        href="/"
        className="flex items-center justify-center lg:justify-start gap-3.5 px-3 py-3 mb-2 group cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Arbiter Home"
      >
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Scale className="w-5 h-5" />
        </motion.div>

        <div className="hidden lg:block min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Arbiter
            </h1>
            <span
              className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded"
              style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
            >
              v1.2
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            Credit Risk Governance
          </p>
        </div>
      </Link>

      {/* Nav section label (Desktop only - px-3 mb-2) */}
      <div className="hidden lg:block px-3 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Governance Modules
        </p>
      </div>

      {/* Navigation items with px-3 py-2.5 rounded-xl gap-3 */}
      <nav className="flex flex-col gap-2 mt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, tag }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center lg:justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative cursor-pointer group"
                style={{
                  background: active ? "var(--accent-muted)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  <span className="hidden lg:inline text-sm">{label}</span>
                </div>

                {/* Badge (AUDIT / REGISTRY / FAIRNESS) - Not clipped */}
                <span
                  className="hidden lg:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-wide shrink-0 ml-auto"
                  style={{
                    background: active ? "var(--accent)" : "var(--surface-overlay)",
                    color: active ? "#ffffff" : "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>

                {/* 2px left accent bar for active state */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
                    style={{ background: "var(--accent)" }}
                    transition={{ duration: 0.18 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Governance Engine Status Card (Bottom - p-4, border, rounded-2xl, stacked pairs) */}
      <div className="mt-auto pt-4">
        {/* Tablet collapsed view */}
        <div className="flex lg:hidden justify-center">
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-color)" }}
            title="Governance Engine: Active"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Desktop full view: padded, bordered, rounded-2xl, stacked label/value pairs */}
        <div
          className="hidden lg:block p-4 rounded-2xl border transition-colors duration-200"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Governance Engine
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              ACTIVE
            </span>
          </div>

          <div className="space-y-2.5 pt-2.5 border-t text-xs font-mono" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Policy Rules</span>
              <span className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>Strict v2.4</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-muted)" }}>Decision Latency</span>
              <span className="font-semibold text-xs text-emerald-500">18ms</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
