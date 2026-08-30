"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Clock, Gauge, Plus, Route as RouteIcon, Users } from "lucide-react";
import type { DriverSummary } from "@/lib/types";
import { EmptyState } from "@/components/page-kit";
import { CardMetrics, EntityCard, EntityGrid, InitialsAvatar } from "@/components/entity-grid";
import { RelativeTime } from "@/components/relative-time";
import { DriverStatusToggle } from "@/components/driver-status-toggle";
import { IssueBadgeButton } from "@/components/issue-badge-button";
import { RevokeDeviceButton } from "@/components/revoke-device-button";
import {
  CollectionFilters,
  CollectionPager,
  CollectionSearch,
  CollectionSort,
  CollectionToolbar,
  useCollection,
  type SortOption,
} from "@/components/collection";

export interface DriverRow extends DriverSummary {
  subcoName?: string;
  trips: number;
  km: number;
  lastTrip: string | null;
}

const SORTS: SortOption<DriverRow>[] = [
  { id: "name", label: "Name (A–Z)", compare: (a, b) => a.lastName.localeCompare(b.lastName) },
  { id: "trips", label: "Most trips", compare: (a, b) => b.trips - a.trips },
  { id: "km", label: "Most distance", compare: (a, b) => b.km - a.km },
  {
    id: "recent",
    label: "Recently active",
    compare: (a, b) => new Date(b.lastTrip ?? 0).getTime() - new Date(a.lastTrip ?? 0).getTime(),
  },
];

export function DriversList({
  drivers,
  showSubco,
}: {
  drivers: DriverRow[];
  showSubco: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const searchFields = useCallback(
    (d: DriverRow) => [d.firstName, d.lastName, `${d.firstName} ${d.lastName}`, d.subcoName],
    [],
  );
  const filterFn = useCallback((d: DriverRow, id: string) => {
    if (id === "active") return d.status === "active";
    if (id === "inactive") return d.status !== "active";
    if (id === "device") return !!d.approvedDeviceId;
    if (id === "no-device") return !d.approvedDeviceId;
    return true;
  }, []);

  const c = useCollection({
    items: drivers,
    search,
    searchFields,
    sorts: SORTS,
    filters: filter,
    filterFn,
  });

  if (drivers.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper shadow-sm">
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No drivers yet"
          description="Add the first driver to issue their badge and let them scan in."
          action={
            <Link
              href="/drivers/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
            >
              <Plus className="h-4 w-4" />
              New driver
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <CollectionToolbar>
        <CollectionSearch value={search} onChange={setSearch} placeholder="Search drivers…" />
        <CollectionFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All", count: drivers.length },
            { id: "active", label: "Active", count: drivers.filter((d) => d.status === "active").length },
            {
              id: "inactive",
              label: "Inactive",
              count: drivers.filter((d) => d.status !== "active").length,
            },
            {
              id: "no-device",
              label: "No device",
              count: drivers.filter((d) => !d.approvedDeviceId).length,
            },
          ]}
        />
        <CollectionSort sorts={SORTS} value={c.sortId} onChange={c.setSortId} />
      </CollectionToolbar>

      {c.items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No drivers match"
            description="Try a different search or clear the filter."
          />
        </div>
      ) : (
        <EntityGrid>
          {c.items.map((d, i) => {
            const name = `${d.firstName} ${d.lastName}`;
            return (
              <EntityCard
                key={d.id}
                index={i}
                href={`/drivers/${d.id}`}
                avatar={<InitialsAvatar name={name} tone={d.status === "active" ? "brand" : "neutral"} />}
                title={name}
                subtitle={showSubco ? (d.subcoName ?? "Unknown subcontractor") : undefined}
                dimmed={d.status !== "active"}
                meta={
                  <CardMetrics
                    items={[
                      { label: "Trips", value: d.trips, icon: <RouteIcon className="h-3 w-3" /> },
                      {
                        label: "Distance",
                        value: d.km > 0 ? `${d.km.toLocaleString()}km` : "—",
                        icon: <Gauge className="h-3 w-3" />,
                        muted: d.km === 0,
                      },
                      {
                        label: "Last trip",
                        value: <RelativeTime iso={d.lastTrip} />,
                        icon: <Clock className="h-3 w-3" />,
                        muted: !d.lastTrip,
                      },
                    ]}
                  />
                }
                actions={
                  <>
                    <DriverStatusToggle driverId={d.id} status={d.status} />
                    {d.approvedDeviceId ? (
                      <RevokeDeviceButton deviceId={d.approvedDeviceId} />
                    ) : (
                      <IssueBadgeButton driverId={d.id} />
                    )}
                  </>
                }
              />
            );
          })}
        </EntityGrid>
      )}

      <CollectionPager
        page={c.page}
        pageCount={c.pageCount}
        matched={c.matched}
        total={c.total}
        pageSize={c.pageSize}
        onPage={c.setPage}
        noun="drivers"
      />
    </>
  );
}
