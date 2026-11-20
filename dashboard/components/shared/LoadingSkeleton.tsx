"use client";

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-xl animate-shimmer border"
          style={{
            background: `linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%)`,
            backgroundSize: "200% 100%",
            borderColor: "var(--border-subtle)",
          }}
        />
      ))}
    </div>
  );
}
