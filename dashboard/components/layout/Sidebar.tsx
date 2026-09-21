"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Scale, FileText, Box, Activity } from "lucide-react";

const NAV_ITEMS = [
  { href: "/decisions", label: "Decisions", icon: FileText },
  { href: "/models", label: "Models", icon: Box },
  { href: "/drift", label: "Drift", icon: Activity },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-56 h-screen sticky top-0"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-5 py-5 group">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.08 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Scale className="w-4.5 h-4.5" />
        </motion.div>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Arbiter
          </h1>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Governance
          </p>
        </div>
      </Link>

      {/* Divider */}
      <div className="mx-4" style={{ borderBottom: "1px solid var(--border-color)" }} />

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 mt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
                style={{
                  background: active ? "var(--accent-muted)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status */}
      <div className="mt-auto px-5 pb-5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
          style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Pipeline active</span>
        </div>
      </div>
    </aside>
  );
}
