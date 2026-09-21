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
      className="hidden lg:flex flex-col w-64 h-screen sticky top-0 p-4 gap-2"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-4 group">
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent)", color: "white" }}
        >
          <Scale className="w-5 h-5" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Arbiter
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Governance
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 mt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? "var(--accent-muted)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="mt-auto px-3 py-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Pipeline: Active</span>
        </div>
      </div>
    </aside>
  );
}
