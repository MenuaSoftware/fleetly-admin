import Link from "next/link";
import { Clock, Gauge, Plus, Route as RouteIcon, Truck } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { VehicleSummary, SubcontractorSummary, TripSummary } from "@/lib/types";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";
import { EmptyState, PageHeader, PageShell } from "@/components/page-kit";
import { RelativeTime } from "@/components/relative-time";
import { CardMetrics, EntityCard, EntityGrid, VehicleAvatar } from "@/components/entity-grid";

const BODY_TYPE_LABEL: Record<VehicleSummary["bodyType"], string> = {
  van: "Van",
  truck: "Truck",
  car: "Car",
};

export default async function VehiclesPage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const [vehicles, subcontractors, trips] = await Promise.all([
    apiFetch<VehicleSummary[]>("/vehicles"),
    isGeneralAdmin ? apiFetch<SubcontractorSummary[]>("/subcontractors") : Promise.resolve([]),
    // One request for the page, grouped per vehicle below — same
    // reasoning as the drivers roster: real figures on each card, no
    // per-card round trip to get them.
    apiFetch<TripSummary[]>("/trips").catch(() => [] as TripSummary[]),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  const inService = vehicles.filter((v) => v.status === "active").length;

  const stats = new Map<string, { trips: number; km: number; last: string | null }>();
  for (const t of trips) {
    const s = stats.get(t.vehicleId) ?? { trips: 0, km: 0, last: null };
    s.trips += 1;
    s.km += t.distance ?? 0;
    if (!s.last || new Date(t.startedAt) > new Date(s.last)) s.last = t.startedAt;
    stats.set(t.vehicleId, s);
  }


  return (
    <PageShell>
      <PageHeader
        eyebrow="Fleet"
        title="Vehicles"
        description="Any driver may take any vehicle in service."
        icon={<Truck className="h-5 w-5" />}
        actions={
          <Link
            href="/vehicles/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            New vehicle
          </Link>
        }
      />

      {vehicles.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <Truck className="h-3.5 w-3.5" />
            <span className="font-mono text-ink">{vehicles.length}</span> total
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            <span className="font-mono text-ink">{inService}</span> in service
          </span>
        </div>
      )}

      {vehicles.length === 0 ? (
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
      ) : (
        <EntityGrid>
          {vehicles.map((v, i) => (
            <EntityCard
              key={v.id}
              index={i}
              href={`/vehicles/${v.id}`}
              avatar={<VehicleAvatar bodyType={v.bodyType} inService={v.status === "active"} />}
              title={v.plate}
              titleMono
              subtitle={
                isGeneralAdmin
                  ? `${BODY_TYPE_LABEL[v.bodyType]} · ${subcoName.get(v.subcoId) ?? "Unknown subcontractor"}`
                  : BODY_TYPE_LABEL[v.bodyType]
              }
              dimmed={v.status !== "active"}
              meta={
                <CardMetrics
                  items={[
                    {
                      label: "Trips",
                      value: stats.get(v.id)?.trips ?? 0,
                      icon: <RouteIcon className="h-3 w-3" />,
                    },
                    {
                      label: "Distance",
                      value:
                        (stats.get(v.id)?.km ?? 0) > 0 ? `${stats.get(v.id)!.km.toLocaleString()}km` : "—",
                      icon: <Gauge className="h-3 w-3" />,
                      muted: (stats.get(v.id)?.km ?? 0) === 0,
                    },
                    {
                      label: "Last used",
                      value: <RelativeTime iso={stats.get(v.id)?.last ?? null} />,
                      icon: <Clock className="h-3 w-3" />,
                      muted: !stats.get(v.id)?.last,
                    },
                  ]}
                />
              }
              actions={<VehicleStatusToggle vehicleId={v.id} status={v.status} />}
            />
          ))}
        </EntityGrid>
      )}
    </PageShell>
  );
}
