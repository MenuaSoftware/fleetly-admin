import Link from "next/link";
import { ChevronRight, Route as RouteIcon, Wrench } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TripSummary } from "@/lib/types";

const STATE_LABEL: Record<TripSummary["state"], string> = {
  active: "Active",
  completed: "Completed",
  force_closed: "Force closed",
};

const STATE_BADGE_CLASS: Record<TripSummary["state"], string> = {
  active: "bg-ok-bg text-ok",
  completed: "bg-wash text-ink-3",
  force_closed: "bg-warn-bg text-warn",
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
 * docs/product-brief.md's dispatcher panel requirements, close to
 * verbatim: "view active trips; view completed trips; view trip
 * details; view driver; view vehicle; view timestamps; view mileage".
 * StaffOnly on the backend (trip-query.controller.ts), RLS-scoped —
 * a dispatcher sees their own subcontractor's trips, general admin
 * sees all, same pattern as every other list screen here.
 */
export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const activeFilter = state === "completed" || state === "force_closed" ? state : "active";

  const trips = await apiFetch<TripSummary[]>(`/trips?state=${activeFilter}`);

  return (
    <div className="mx-auto w-full max-w-3xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Trips</h1>
          <p className="text-sm text-ink-3">Mileage, timestamps, and photographic evidence.</p>
        </div>
        <Link
          href="/trips/reconcile"
          className="flex items-center gap-1.5 rounded-xl border border-line-2 px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-wash"
        >
          <Wrench className="h-4 w-4" />
          Reconcile a trip
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {(["active", "completed", "force_closed"] as const).map((s) => (
          <Link
            key={s}
            href={`/trips?state=${s}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === s
                ? "bg-accent text-white shadow-sm"
                : "border border-line-2 text-ink-2 hover:bg-wash"
            }`}
          >
            {STATE_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <RouteIcon className="h-8 w-8 text-ink-3" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">No {STATE_LABEL[activeFilter].toLowerCase()} trips right now.</p>
          </div>
        ) : (
          <ul>
            {trips.map((t, i) => (
              <li key={t.id} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={`/trips/${t.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-wash"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {t.driverName ?? "Unknown driver"}
                      <span className="text-ink-3"> · </span>
                      <span className="font-mono">{t.vehiclePlate ?? "—"}</span>
                    </p>
                    <p className="text-xs text-ink-3">
                      {formatWhen(t.startedAt)}
                      {t.distance !== null ? ` · ${t.distance} km` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 font-mono text-xs ${STATE_BADGE_CLASS[t.state]}`}>
                      {STATE_LABEL[t.state]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-ink-3" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
