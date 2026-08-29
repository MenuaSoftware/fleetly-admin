"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CircleAlert, MapPin, Wrench } from "lucide-react";
import type { IncidentSummary } from "@/lib/types";
import { IncidentPhotoGallery } from "@/components/incident-photo-gallery";
import { StatusPill } from "@/components/page-kit";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

const TYPE_LABEL: Record<IncidentSummary["type"], string> = {
  breakdown: "Breakdown",
  new_damage: "New damage",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Incidents are events on a clock, not records in a roster, so they get
 * a timeline: one continuous rail with a typed node per report. That
 * shape carries the ordering and the gaps between reports in a way a
 * table of rows does not — and it makes this screen read differently
 * from /trips and /drivers, which is the point.
 */
export function IncidentTimeline({ incidents }: { incidents: IncidentSummary[] }) {
  return (
    <ol className="relative">
      {/* The rail. Stops short of the last node so the line doesn't
          dangle past the final entry. */}
      <span
        aria-hidden
        className="absolute top-2 bottom-8 left-[1.15rem] w-px bg-line"
      />
      {incidents.map((inc, i) => (
        <motion.li
          key={inc.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.32, ease: EASE_OUT }}
          className="relative flex gap-4 pb-5 last:pb-0"
        >
          <span
            className={cn(
              "relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-paper",
              inc.type === "breakdown" ? "bg-warn-bg text-warn" : "bg-bad-bg text-bad",
            )}
          >
            {inc.type === "breakdown" ? (
              <Wrench className="h-4 w-4" />
            ) : (
              <CircleAlert className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0 flex-1 rounded-2xl border border-line bg-paper p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {inc.driverName ?? "Unknown driver"}
                <span className="mx-1.5 font-normal text-ink-3">·</span>
                <span className="font-mono text-xs font-normal text-ink-2">{inc.vehiclePlate ?? "—"}</span>
              </p>
              <StatusPill tone={inc.type === "breakdown" ? "warn" : "bad"}>
                {TYPE_LABEL[inc.type]}
              </StatusPill>
            </div>

            <p className="text-sm text-ink-2">{inc.note}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
              <time dateTime={inc.capturedAt} className="font-mono">
                {formatWhen(inc.capturedAt)}
              </time>
              {inc.locationLat !== null && inc.locationLng !== null && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <MapPin className="h-3 w-3" />
                  {inc.locationLat.toFixed(3)}, {inc.locationLng.toFixed(3)}
                </span>
              )}
              {inc.tripId && (
                <Link
                  href={`/trips/${inc.tripId}`}
                  className="font-medium text-brand transition-colors hover:text-brand-strong"
                >
                  View trip
                </Link>
              )}
            </div>

            <div className="mt-2">
              <IncidentPhotoGallery incidentId={inc.id} />
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
