"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-6 h-16 backdrop-blur-xl"
      style={{
        background: "var(--header-bg)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Mobile logo + hamburger */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
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
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>
            Arbiter
          </span>
        </Link>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200"
                style={{
                  background: active ? "var(--accent-muted)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <ModeToggle />
        <ThemeToggle />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 left-0 right-0 p-4 flex flex-col gap-2 lg:hidden"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
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
    </header>
  );
}
