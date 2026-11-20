"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, FileText, Box, Activity, Menu, X, ChevronRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ModeToggle } from "@/components/ui/ModeToggle";

const NAV_ITEMS = [
  { href: "/decisions", label: "Decisions", icon: FileText },
  { href: "/models", label: "Models", icon: Box },
  { href: "/drift", label: "Drift", icon: Activity },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = NAV_ITEMS.find((item) => item.href === pathname);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10 h-16 backdrop-blur-md transition-colors duration-150"
      style={{
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Left: Mobile hamburger + logo | Desktop: Breadcrumb with icon */}
      <div className="flex items-center gap-3">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150 border cursor-pointer hover:bg-slate-500/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{
              background: "var(--input-bg)",
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
            }}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link href="/" className="flex items-center gap-2" aria-label="Arbiter Home">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ background: "var(--accent)", color: "white" }}
            >
              <Scale className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
              Arbiter
            </span>
          </Link>
        </div>

        {/* Desktop & Tablet: Breadcrumb trail */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="font-medium" style={{ color: "var(--text-muted)" }}>
            Governance Platform
          </span>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          {currentPage && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: "var(--accent-muted)" }}>
              <currentPage.icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
              <span className="font-semibold text-xs" style={{ color: "var(--accent)" }}>
                {currentPage.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Live compliance pill (Desktop only) */}
      <div
        className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium border"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
        }}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Policy Enforcement:</span>
        <span className="font-semibold text-emerald-500">Zero Violations Active</span>
      </div>

      {/* Right: Controls (gap-3, no clipping) */}
      <div className="flex items-center gap-3">
        <ModeToggle />
        <ThemeToggle />
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute top-16 left-0 right-0 p-4 flex flex-col gap-2 md:hidden z-50 border-b shadow-xl"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-color)",
              }}
            >
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150"
                      style={{
                        background: active ? "var(--accent-muted)" : "var(--surface-raised)",
                        color: active ? "var(--accent)" : "var(--text-primary)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
