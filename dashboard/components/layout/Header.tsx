"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, FileText, Box, Activity, Menu, X } from "lucide-react";
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

  // Find current page title
  const currentPage = NAV_ITEMS.find((item) => item.href === pathname);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6 h-14 backdrop-blur-xl"
      style={{
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Left: Mobile hamburger + logo | Desktop: page title */}
      <div className="flex items-center gap-3">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80"
            style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)", color: "white" }}
            >
              <Scale className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Arbiter
            </span>
          </Link>
        </div>

        {/* Desktop: page title with icon */}
        <div className="hidden lg:flex items-center gap-2">
          {currentPage && (
            <>
              <currentPage.icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {currentPage.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <ModeToggle />
        <ThemeToggle />
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-0 right-0 p-3 flex flex-col gap-1 lg:hidden z-50"
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border-color)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    background: pathname === href ? "var(--accent-muted)" : "transparent",
                    color: pathname === href ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
