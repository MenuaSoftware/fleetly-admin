"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { StatusPill, type Tone } from "@/components/page-kit";

/**
 * Card grid used by the roster screens (drivers, vehicles). These are
 * *entities you act on* rather than events you scan chronologically, so
 * they get a grid of self-contained cards — each carrying its own
 * controls — instead of the dense table the trip log uses. Different
 * job, different shape.
 */

export function EntityGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>
  );
}

export function EntityCard({
  index = 0,
  avatar,
  title,
  titleMono = false,
  subtitle,
  meta,
  statusLabel,
  statusTone = "neutral",
  actions,
  dimmed = false,
}: {
  index?: number;
  avatar?: React.ReactNode;
  title: string;
  /** Set for titles that are data rather than prose — plates, ids. */
  titleMono?: boolean;
  subtitle?: string;
  meta?: React.ReactNode;
  statusLabel?: string;
  statusTone?: Tone;
  actions?: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.3, ease: EASE_OUT }}
      className={cn(
        "flex flex-col rounded-2xl border border-line bg-paper p-4 shadow-sm transition-shadow hover:shadow-md",
        // Deactivated records stay legible rather than being greyed to
        // the point of unreadability — they're still actionable.
        dimmed && "border-dashed",
      )}
    >
      <div className="flex items-start gap-3">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold text-ink", titleMono && "font-mono")}>{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-ink-3">{subtitle}</p>}
        </div>
        {statusLabel && <StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
      </div>

      {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">{meta}</div>}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">{actions}</div>
      )}
    </motion.article>
  );
}

/** Initials chip — cheap identity marker, no avatar images in this product. */
export function InitialsAvatar({ name, tone = "brand" }: { name: string; tone?: Tone }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const TONE: Record<string, string> = {
    brand: "bg-brand-soft text-brand",
    ok: "bg-ok-bg text-ok",
    warn: "bg-warn-bg text-warn",
    bad: "bg-bad-bg text-bad",
    info: "bg-info-bg text-info",
    "viz-2": "bg-viz-2/10 text-viz-2",
    "viz-3": "bg-viz-3/10 text-viz-3",
    neutral: "bg-sunken text-ink-2",
  };

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-semibold",
        TONE[tone] ?? TONE.neutral,
      )}
    >
      {initials || "?"}
    </span>
  );
}
