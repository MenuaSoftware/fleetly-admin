import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { VehicleSummary, SubcontractorSummary } from "@/lib/types";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";
import { EmptyState, PageHeader, PageShell } from "@/components/page-kit";
import { EntityCard, EntityGrid, VehicleAvatar } from "@/components/entity-grid";

const BODY_TYPE_LABEL: Record<VehicleSummary["bodyType"], string> = {
  van: "Van",
  truck: "Truck",
  car: "Car",
};

export default async function VehiclesPage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const [vehicles, subcontractors] = await Promise.all([
    apiFetch<VehicleSummary[]>("/vehicles"),
    isGeneralAdmin ? apiFetch<SubcontractorSummary[]>("/subcontractors") : Promise.resolve([]),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  const inService = vehicles.filter((v) => v.status === "active").length;

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
              actions={<VehicleStatusToggle vehicleId={v.id} status={v.status} />}
            />
          ))}
        </EntityGrid>
      )}
    </PageShell>
  );
}
