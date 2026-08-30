"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Clock, Gauge, Plus, Route as RouteIcon, Truck } from "lucide-react";
import type { VehicleSummary } from "@/lib/types";
import { EmptyState } from "@/components/page-kit";
import { CardMetrics, EntityCard, EntityGrid, VehicleAvatar } from "@/components/entity-grid";
import { RelativeTime } from "@/components/relative-time";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";
import {
  CollectionFilters,
  CollectionPager,
  CollectionSearch,
  CollectionSort,
  CollectionToolbar,
  useCollection,
  type SortOption,
} from "@/components/collection";

const BODY_TYPE_LABEL: Record<VehicleSummary["bodyType"], string> = {
  van: "Van",
  truck: "Truck",
  car: "Car",
};

export interface VehicleRow extends VehicleSummary {
  subcoName?: string;
  trips: number;
  km: number;
  lastUsed: string | null;
}

const SORTS: SortOption<VehicleRow>[] = [
  { id: "plate", label: "Plate (A–Z)", compare: (a, b) => a.plate.localeCompare(b.plate) },
  { id: "trips", label: "Most trips", compare: (a, b) => b.trips - a.trips },
  { id: "km", label: "Most distance", compare: (a, b) => b.km - a.km },
  {
    id: "recent",
    label: "Recently used",
    compare: (a, b) => new Date(b.lastUsed ?? 0).getTime() - new Date(a.lastUsed ?? 0).getTime(),
  },
];

export function VehiclesList({
  vehicles,
  showSubco,
}: {
  vehicles: VehicleRow[];
  showSubco: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const searchFields = useCallback(
    (v: VehicleRow) => [v.plate, v.bodyType, BODY_TYPE_LABEL[v.bodyType], v.subcoName],
    [],
  );
  const filterFn = useCallback((v: VehicleRow, id: string) => {
    if (id === "active") return v.status === "active";
    if (id === "out") return v.status !== "active";
    if (id === "idle") return v.trips === 0;
    return true;
  }, []);

  const c = useCollection({
    items: vehicles,
    search,
    searchFields,
    sorts: SORTS,
    filters: filter,
    filterFn,
  });

  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper shadow-sm">
        <EmptyState
          icon={<Truck className="h-5 w-5" />}
          title="No vehicles yet"
          description="Add the first vehicle so drivers have something to check out."
          action={
            <Link
              href="/vehicles/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
            >
              <Plus className="h-4 w-4" />
              New vehicle
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <CollectionToolbar>
        <CollectionSearch value={search} onChange={setSearch} placeholder="Search by plate…" />
        <CollectionFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All", count: vehicles.length },
            {
              id: "active",
              label: "In service",
              count: vehicles.filter((v) => v.status === "active").length,
            },
            {
              id: "out",
              label: "Out of service",
              count: vehicles.filter((v) => v.status !== "active").length,
            },
            { id: "idle", label: "Never used", count: vehicles.filter((v) => v.trips === 0).length },
          ]}
        />
        <CollectionSort sorts={SORTS} value={c.sortId} onChange={c.setSortId} />
      </CollectionToolbar>

      {c.items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<Truck className="h-5 w-5" />}
            title="No vehicles match"
            description="Try a different search or clear the filter."
          />
        </div>
      ) : (
        <EntityGrid>
          {c.items.map((v, i) => (
            <EntityCard
              key={v.id}
              index={i}
              href={`/vehicles/${v.id}`}
              avatar={<VehicleAvatar bodyType={v.bodyType} inService={v.status === "active"} />}
              title={v.plate}
              titleMono
              subtitle={
                showSubco
                  ? `${BODY_TYPE_LABEL[v.bodyType]} · ${v.subcoName ?? "Unknown subcontractor"}`
                  : BODY_TYPE_LABEL[v.bodyType]
              }
              dimmed={v.status !== "active"}
              meta={
                <CardMetrics
                  items={[
                    { label: "Trips", value: v.trips, icon: <RouteIcon className="h-3 w-3" /> },
                    {
                      label: "Distance",
                      value: v.km > 0 ? `${v.km.toLocaleString()}km` : "—",
                      icon: <Gauge className="h-3 w-3" />,
                      muted: v.km === 0,
                    },
                    {
                      label: "Last used",
                      value: <RelativeTime iso={v.lastUsed} />,
                      icon: <Clock className="h-3 w-3" />,
                      muted: !v.lastUsed,
                    },
                  ]}
                />
              }
              actions={<VehicleStatusToggle vehicleId={v.id} status={v.status} />}
            />
          ))}
        </EntityGrid>
      )}

      <CollectionPager
        page={c.page}
        pageCount={c.pageCount}
        matched={c.matched}
        total={c.total}
        pageSize={c.pageSize}
        onPage={c.setPage}
        noun="vehicles"
      />
    </>
  );
}
