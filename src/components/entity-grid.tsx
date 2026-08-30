"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Car, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpotlight } from "@/components/spotlight-card";
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
  href,
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
  /** Detail page for this record, if it has one. */
  href?: string;
}) {
  const spot = useSpotlight();

  const identity = (
    <div className="flex items-start gap-3">
      {avatar}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold text-ink transition-colors group-hover/card:text-brand-strong",
            titleMono ? "font-mono text-[0.95rem]" : "font-display text-[0.975rem]",
          )}
        >
          {title}
        </p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-ink-3">{subtitle}</p>}
      </div>
      {statusLabel && <StatusPill tone={statusTone}>{statusLabel}</StatusPill>}
      {href && (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3 transition-all group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:text-brand" />
      )}
    </div>
  );

  return (
    <motion.article
      onPointerMove={spot.onPointerMove}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={href ? { y: -3 } : undefined}
      transition={{ delay: Math.min(index * 0.035, 0.35), duration: 0.3, ease: EASE_OUT }}
      className={cn(
        "spotlight group/card relative flex flex-col rounded-2xl border border-line bg-paper p-4 shadow-sm",
        "transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lg",
        // Deactivated records stay legible rather than being greyed to
        // the point of unreadability — they're still actionable.
        dimmed && "border-dashed",
      )}
    >
      {spot.enabled && <span {...spot.layerProps} />}

      {/* Only the identity block links through. The card can't be one
          big anchor: the actions row holds real buttons, and nesting
          interactive controls inside a link is invalid and makes them
          fight for the same click. */}
      {href ? (
        <Link
          href={href}
          className="relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {identity}
        </Link>
      ) : (
        identity
      )}

      {meta && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">{meta}</div>
      )}

      {actions && (
        <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {actions}
        </div>
      )}
    </motion.article>
  );
}

/**
 * Compact figures for a card's `meta` slot. Roster cards were carrying
 * only labels ("No device") and read as thin because of it — a card
 * with real numbers on it feels substantial in a way no amount of
 * shadow or gradient achieves.
 */
export function CardMetrics({
  items,
}: {
  items: { label: string; value: React.ReactNode; icon?: React.ReactNode; muted?: boolean }[];
}) {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {items.map((m) => (
        <div key={m.label} className="min-w-0">
          <p className="flex items-center gap-1 text-[0.65rem] tracking-wide text-ink-3 uppercase">
            {m.icon}
            <span className="truncate">{m.label}</span>
          </p>
          <p
            className={cn(
              "mt-0.5 truncate font-mono text-sm font-semibold",
              m.muted ? "text-ink-3" : "text-ink",
            )}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Vehicle identity chip. A component rather than inline markup at each
 * call site: the vehicles list and the vehicle detail page both need
 * it, and building the same span inline in both had them drift.
 */
export function VehicleAvatar({
  bodyType,
  inService,
  size = "sm",
}: {
  bodyType: "van" | "truck" | "car";
  inService: boolean;
  size?: "sm" | "lg";
}) {
  const Icon = bodyType === "car" ? Car : Truck;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10",
        inService ? "bg-viz-3/10 text-viz-3" : "bg-sunken text-ink-3",
      )}
    >
      <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
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
