import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { VehicleSummary, SubcontractorSummary, TripSummary } from "@/lib/types";
import { PageHeader, PageShell } from "@/components/page-kit";
import { VehiclesList, type VehicleRow } from "@/components/vehicles-list";

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

  const stats = new Map<string, { trips: number; km: number; last: string | null }>();
  for (const t of trips) {
    const s = stats.get(t.vehicleId) ?? { trips: 0, km: 0, last: null };
    s.trips += 1;
    s.km += t.distance ?? 0;
    if (!s.last || new Date(t.startedAt) > new Date(s.last)) s.last = t.startedAt;
    stats.set(t.vehicleId, s);
  }

  const rows: VehicleRow[] = vehicles.map((v) => ({
    ...v,
    subcoName: subcoName.get(v.subcoId),
    trips: stats.get(v.id)?.trips ?? 0,
    km: stats.get(v.id)?.km ?? 0,
    lastUsed: stats.get(v.id)?.last ?? null,
  }));


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


      <VehiclesList vehicles={rows} showSubco={isGeneralAdmin} />
    </PageShell>
  );
}
