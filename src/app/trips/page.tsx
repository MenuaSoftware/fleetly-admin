import Link from "next/link";
import { Route as RouteIcon, Wrench } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TripSummary } from "@/lib/types";
import { PageHeader, PageShell } from "@/components/page-kit";
import { TripFilterTabs, type TripState } from "@/components/trips-table";
import { TripsView } from "@/components/trips-view";

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
  const activeFilter: TripState =
    state === "completed" || state === "force_closed" ? state : "active";

  const trips = await apiFetch<TripSummary[]>(`/trips?state=${activeFilter}`);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Operations"
        title="Trips"
        description="Mileage, timestamps, and photographic evidence."
        icon={<RouteIcon className="h-5 w-5" />}
        actions={
          <Link
            href="/trips/reconcile"
            className="inline-flex items-center gap-2 rounded-xl border border-line-2 bg-paper px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <Wrench className="h-4 w-4" />
            Reconcile a trip
          </Link>
        }
      />

      <div className="mb-4">
        <TripFilterTabs active={activeFilter} />
      </div>

      <TripsView trips={trips} filter={activeFilter} />
    </PageShell>
  );
}
