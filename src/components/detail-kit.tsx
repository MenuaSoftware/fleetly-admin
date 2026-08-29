"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { DocumentSummary, TripSummary } from "@/lib/types";
import { EmptyState, LiveDot, StatusPill, type Tone } from "@/components/page-kit";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

/**
 * Shared pieces of the driver and vehicle detail screens. Both answer
 * the same shape of question — "what is this thing, and what has it
 * been doing?" — so they share a masthead, a figure strip, and the
 * trip/document panels, while each keeps the sections only it has
 * (device enrolment for a driver, the damage register for a vehicle).
 */

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Identity block at the top of a detail page. */
export function DetailMasthead({
  avatar,
  title,
  titleMono = false,
  subtitle,
  status,
  actions,
}: {
  avatar: React.ReactNode;
  title: string;
  titleMono?: boolean;
  subtitle?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="mb-5 rounded-2xl border border-line bg-paper p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {avatar}
          <div className="min-w-0">
            <h1
              className={cn(
                "truncate text-xl font-semibold text-ink",
                titleMono ? "font-mono" : "font-display",
              )}
            >
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 truncate text-sm text-ink-2">{subtitle}</p>}
          </div>
        </div>
        {status}
      </div>
      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">{actions}</div>
      )}
    </motion.div>
  );
}

/** Compact figure strip — the headline numbers for this record. */
export function DetailStats({
  stats,
}: {
  stats: { label: string; value: string | number; icon?: React.ReactNode; tone?: Tone }[];
}) {
  const TONE: Record<string, string> = {
    brand: "text-brand",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    info: "text-info",
    "viz-2": "text-viz-2",
    "viz-3": "text-viz-3",
    neutral: "text-ink",
  };
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.28, ease: EASE_OUT }}
          className="rounded-2xl border border-line bg-paper p-4 shadow-sm"
        >
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-3">
            {s.icon}
            {s.label}
          </p>
          <p className={cn("font-mono text-xl leading-none font-semibold", TONE[s.tone ?? "neutral"])}>
            {s.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

const TRIP_STATE_TONE: Record<TripSummary["state"], Tone> = {
  active: "ok",
  completed: "neutral",
  force_closed: "warn",
};

const TRIP_STATE_LABEL: Record<TripSummary["state"], string> = {
  active: "Active",
  completed: "Completed",
  force_closed: "Force closed",
};

/**
 * Trip history for one driver or vehicle. `secondary` picks which
 * counterpart column to show — a driver's trips list the vehicle they
 * took, a vehicle's list the driver who took it.
 */
export function DetailTripList({
  trips,
  secondary,
  emptyTitle,
  emptyDescription,
}: {
  trips: TripSummary[];
  secondary: "vehicle" | "driver";
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (trips.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ul className="divide-y divide-line">
      {trips.map((t, i) => (
        <motion.li
          key={t.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.28, ease: EASE_OUT }}
        >
          <Link
            href={`/trips/${t.id}`}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
          >
            {t.state === "active" ? <LiveDot tone="ok" /> : <span className="w-2" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {secondary === "vehicle" ? (
                  <span className="font-mono text-xs">{t.vehiclePlate ?? "—"}</span>
                ) : (
                  (t.driverName ?? "Unknown driver")
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-3">
                {formatWhen(t.startedAt)}
                {t.distance !== null && ` · ${t.distance.toLocaleString()} km`}
              </p>
            </div>
            <StatusPill tone={TRIP_STATE_TONE[t.state]}>{TRIP_STATE_LABEL[t.state]}</StatusPill>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-brand" />
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

const DOC_TONE: Record<DocumentSummary["status"], Tone> = {
  valid: "ok",
  expiring_soon: "warn",
  expired: "bad",
};

const DOC_LABEL: Record<DocumentSummary["status"], string> = {
  valid: "valid",
  expiring_soon: "expiring",
  expired: "expired",
};

/** Documents filed against this record, worst-expiry first. */
export function DetailDocumentList({ documents }: { documents: DocumentSummary[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents on file"
        description="Upload registration, insurance or licence files from the Documents screen."
      />
    );
  }
  return (
    <ul className="divide-y divide-line">
      {documents.map((d, i) => (
        <motion.li
          key={d.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.28, ease: EASE_OUT }}
          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{d.typeName}</p>
            <p className="mt-0.5 text-xs text-ink-3">
              Expires <span className="font-mono">{formatDate(d.expiryDate)}</span>
              {d.uploadStatus === "pending" && " · upload never confirmed"}
            </p>
          </div>
          <StatusPill tone={d.uploadStatus === "pending" ? "neutral" : DOC_TONE[d.status]}>
            {d.uploadStatus === "pending" ? "pending" : DOC_LABEL[d.status]}
          </StatusPill>
        </motion.li>
      ))}
    </ul>
  );
}
