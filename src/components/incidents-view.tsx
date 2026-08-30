"use client";

import { useCallback, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { IncidentSummary } from "@/lib/types";
import { EmptyState } from "@/components/page-kit";
import { IncidentTimeline } from "@/components/incident-timeline";
import {
  CollectionFilters,
  CollectionPager,
  CollectionSearch,
  CollectionSort,
  CollectionToolbar,
  useCollection,
  type SortOption,
} from "@/components/collection";

const SORTS: SortOption<IncidentSummary>[] = [
  {
    id: "newest",
    label: "Newest first",
    compare: (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  },
  {
    id: "oldest",
    label: "Oldest first",
    compare: (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  },
  { id: "driver", label: "Driver (A–Z)", compare: (a, b) => (a.driverName ?? "").localeCompare(b.driverName ?? "") },
];

/**
 * Incidents are a chronological feed, so they page rather than scroll
 * forever, and default to newest-first. The search covers the note text
 * as well as driver and plate — "what did that report about the
 * gearbox say" is a real way to look for one.
 */
export function IncidentsView({ incidents }: { incidents: IncidentSummary[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const searchFields = useCallback(
    (i: IncidentSummary) => [i.driverName, i.vehiclePlate, i.note, i.type],
    [],
  );
  const filterFn = useCallback((i: IncidentSummary, id: string) => {
    if (id === "breakdown") return i.type === "breakdown";
    if (id === "damage") return i.type === "new_damage";
    return true;
  }, []);

  const c = useCollection({
    items: incidents,
    search,
    searchFields,
    sorts: SORTS,
    filters: filter,
    filterFn,
    pageSize: 10,
  });

  if (incidents.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper shadow-sm">
        <EmptyState
          icon={<TriangleAlert className="h-5 w-5" />}
          title="No incidents reported"
          description="Drivers report breakdowns and new damage from the mobile app. Anything they send appears here."
        />
      </div>
    );
  }

  return (
    <>
      <CollectionToolbar>
        <CollectionSearch value={search} onChange={setSearch} placeholder="Search incidents…" />
        <CollectionFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All", count: incidents.length },
            {
              id: "breakdown",
              label: "Breakdowns",
              count: incidents.filter((i) => i.type === "breakdown").length,
            },
            {
              id: "damage",
              label: "New damage",
              count: incidents.filter((i) => i.type === "new_damage").length,
            },
          ]}
        />
        <CollectionSort sorts={SORTS} value={c.sortId} onChange={c.setSortId} />
      </CollectionToolbar>

      {c.items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<TriangleAlert className="h-5 w-5" />}
            title="No incidents match"
            description="Try a different search or clear the filter."
          />
        </div>
      ) : (
        <IncidentTimeline incidents={c.items} />
      )}

      <CollectionPager
        page={c.page}
        pageCount={c.pageCount}
        matched={c.matched}
        total={c.total}
        pageSize={c.pageSize}
        onPage={c.setPage}
        noun="incidents"
      />
    </>
  );
}
