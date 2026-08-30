"use client";

import { useCallback, useState } from "react";
import type { TripSummary } from "@/lib/types";
import { SectionCard } from "@/components/page-kit";
import { TripsTable, type TripState } from "@/components/trips-table";
import {
  CollectionPager,
  CollectionSearch,
  CollectionSort,
  CollectionToolbar,
  useCollection,
  type SortOption,
} from "@/components/collection";

const SORTS: SortOption<TripSummary>[] = [
  {
    id: "newest",
    label: "Newest first",
    compare: (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  },
  {
    id: "oldest",
    label: "Oldest first",
    compare: (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  },
  { id: "distance", label: "Longest distance", compare: (a, b) => (b.distance ?? 0) - (a.distance ?? 0) },
  {
    id: "driver",
    label: "Driver (A–Z)",
    compare: (a, b) => (a.driverName ?? "").localeCompare(b.driverName ?? ""),
  },
];

/**
 * Search, sort and paging over one trip state.
 *
 * Client-side, like the roster screens — but this is the one list where
 * that is a deliberate trade rather than an obvious win. The page
 * fetches every trip in the selected state, which is fine at a
 * subcontractor's realistic volume and keeps search working across the
 * whole set rather than only the visible page.
 *
 * The point at which this needs to change is when a single state's
 * history outgrows one response. That needs BOTH `limit`/`offset` and
 * real server-side search on GET /trips — paging alone would silently
 * reduce search to "the current page", which is worse than what is here
 * now. The ?driverId=/?vehicleId= filters already added to that
 * endpoint are the first half of that work.
 */
export function TripsView({ trips, filter }: { trips: TripSummary[]; filter: TripState }) {
  const [search, setSearch] = useState("");

  const searchFields = useCallback(
    (t: TripSummary) => [t.driverName, t.vehiclePlate, t.origin],
    [],
  );

  const c = useCollection({
    items: trips,
    search,
    searchFields,
    sorts: SORTS,
    pageSize: 15,
  });

  return (
    <>
      {trips.length > 0 && (
        <CollectionToolbar>
          <CollectionSearch
            value={search}
            onChange={setSearch}
            placeholder="Search driver, plate or origin…"
          />
          <CollectionSort sorts={SORTS} value={c.sortId} onChange={c.setSortId} />
        </CollectionToolbar>
      )}

      <SectionCard flush>
        <TripsTable trips={c.items} filter={filter} />
      </SectionCard>

      {trips.length > 0 && (
        <CollectionPager
          page={c.page}
          pageCount={c.pageCount}
          matched={c.matched}
          total={c.total}
          pageSize={c.pageSize}
          onPage={c.setPage}
          noun="trips"
        />
      )}
    </>
  );
}
