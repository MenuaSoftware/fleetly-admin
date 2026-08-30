"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Gauge, Route as RouteIcon } from "lucide-react";
import type { TripSummary } from "@/lib/types";
import { EmptyState, LiveDot, StatusPill, type Tone } from "@/components/page-kit";
import { cn } from "@/lib/utils";
import { EASE_OUT, springSnappy } from "@/lib/motion";

export const TRIP_STATES = ["active", "completed", "force_closed"] as const;
export type TripState = (typeof TRIP_STATES)[number];

export const STATE_LABEL: Record<TripState, string> = {
  active: "Active",
  completed: "Completed",
  force_closed: "Force closed",
};

const STATE_TONE: Record<TripState, Tone> = {
  active: "ok",
  completed: "neutral",
  force_closed: "warn",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Pill filter bar; the selected pill is one shared, sliding element. */
export function TripFilterTabs({ active }: { active: TripState }) {
  const reduced = useReducedMotion();
  return (
    <div className="inline-flex gap-1 rounded-full border border-line bg-paper p-1 shadow-sm">
      {TRIP_STATES.map((s) => {
        const isActive = active === s;
        return (
          <Link
            key={s}
            href={`/trips?state=${s}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive ? "text-brand-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="trip-filter-pill"
                transition={reduced ? { duration: 0 } : springSnappy}
                className="absolute inset-0 rounded-full bg-brand shadow-[0_2px_10px_-2px_rgb(var(--brand-glow)/0.5)]"
              />
            )}
            <span className="relative">{STATE_LABEL[s]}</span>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Trip list. A real table on desktop — a dispatcher scans this column
 * by column, and aligned columns are what make that possible — and
 * stacked cards below `md`, where a five-column table would either
 * overflow or shrink to unreadable.
 */
export function TripsTable({ trips, filter }: { trips: TripSummary[]; filter: TripState }) {
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<RouteIcon className="h-5 w-5" />}
        title={`No ${STATE_LABEL[filter].toLowerCase()} trips`}
        description={
          filter === "active"
            ? "Trips appear here the moment a driver opens one from the mobile app."
            : "Nothing has landed in this state yet."
        }
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-line text-left">
            {["Driver", "Vehicle", "Started", "Distance", "State", ""].map((h, i) => (
              <th
                key={h || i}
                className={cn(
                  "px-5 py-2.5 font-mono text-micro font-medium tracking-[0.12em] text-ink-3 uppercase",
                  h === "Distance" && "text-right",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.map((t, i) => (
            <motion.tr
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.28, ease: EASE_OUT }}
              className="group/row relative border-b border-line last:border-0 transition-colors hover:bg-sunken"
            >
              <td className="relative px-5 py-3">
                {/* Accent rail on hover — gives a wide table row a clear
                    left edge to track along, which a background tint
                    alone doesn't provide at this density. */}
                <span className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-brand transition-transform duration-200 group-hover/row:scale-y-100" />
                <Link href={`/trips/${t.id}`} className="flex items-center gap-2.5">
                  {t.state === "active" && <LiveDot tone="ok" />}
                  <span className="text-sm font-medium text-ink transition-colors group-hover/row:text-brand-strong">
                    {t.driverName ?? "Unknown driver"}
                  </span>
                </Link>
              </td>
              <td className="px-5 py-3">
                <span className="font-mono text-xs text-ink-2">{t.vehiclePlate ?? "—"}</span>
              </td>
              <td className="px-5 py-3 text-xs whitespace-nowrap text-ink-3">{formatWhen(t.startedAt)}</td>
              <td className="px-5 py-3 text-right">
                <span className="font-mono text-xs text-ink-2">
                  {t.distance !== null ? `${t.distance.toLocaleString()} km` : "—"}
                </span>
              </td>
              <td className="px-5 py-3">
                <StatusPill tone={STATE_TONE[t.state]}>{STATE_LABEL[t.state]}</StatusPill>
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  href={`/trips/${t.id}`}
                  aria-label={`Open trip for ${t.driverName ?? "unknown driver"}`}
                  className="inline-flex text-ink-3 transition-colors group-hover/row:text-brand"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {trips.map((t, i) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.28, ease: EASE_OUT }}
          >
            <Link href={`/trips/${t.id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-sunken">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {t.state === "active" && <LiveDot tone="ok" />}
                  <p className="truncate text-sm font-medium text-ink">{t.driverName ?? "Unknown driver"}</p>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3">
                  <span className="font-mono text-ink-2">{t.vehiclePlate ?? "—"}</span>
                  <span>·</span>
                  <span>{formatWhen(t.startedAt)}</span>
                  {t.distance !== null && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Gauge className="h-3 w-3" />
                        {t.distance} km
                      </span>
                    </>
                  )}
                </p>
              </div>
              <StatusPill tone={STATE_TONE[t.state]}>{STATE_LABEL[t.state]}</StatusPill>
            </Link>
          </motion.li>
        ))}
      </ul>
    </>
  );
}
