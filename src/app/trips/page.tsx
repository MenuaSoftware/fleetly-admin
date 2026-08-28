import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, TripSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const trips = await apiFetch<TripSummary[]>(`/trips?state=${activeFilter}`);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Trips</h1>
          <p className="text-sm text-ink-3">Mileage, timestamps, and photographic evidence.</p>
        </div>

        <div className="mb-4 flex gap-2">
          {(["active", "completed", "force_closed"] as const).map((s) => (
            <Link
              key={s}
              href={`/trips?state=${s}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === s
                  ? "bg-accent text-white"
                  : "border border-line-2 text-ink-2 hover:bg-wash"
              }`}
            >
              {STATE_LABEL[s]}
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {trips.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-3">
              No {STATE_LABEL[activeFilter].toLowerCase()} trips right now.
            </p>
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
                    <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs ${STATE_BADGE_CLASS[t.state]}`}>
                      {STATE_LABEL[t.state]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
