import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { DriverSummary, SubcontractorSummary, TripSummary } from "@/lib/types";
import { PageHeader, PageShell } from "@/components/page-kit";
import { DriversList, type DriverRow } from "@/components/drivers-list";

export default async function DriversPage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const [drivers, subcontractors, trips] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers"),
    // Only needed to label each card with its subcontractor when the
    // viewer can see drivers across more than one — a dispatcher's own
    // list is already scoped to their one subco by RLS, so skip the
    // extra round trip for them.
    isGeneralAdmin ? apiFetch<SubcontractorSummary[]>("/subcontractors") : Promise.resolve([]),
    // One request for the whole page, grouped per driver below, rather
    // than a ?driverId= call per card. Cards carrying real figures are
    // what makes this screen a roster rather than a list of names; an
    // N+1 to achieve it would not be worth it.
    apiFetch<TripSummary[]>("/trips").catch(() => [] as TripSummary[]),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  const stats = new Map<string, { trips: number; km: number; last: string | null }>();
  for (const t of trips) {
    const s = stats.get(t.driverId) ?? { trips: 0, km: 0, last: null };
    s.trips += 1;
    s.km += t.distance ?? 0;
    if (!s.last || new Date(t.startedAt) > new Date(s.last)) s.last = t.startedAt;
    stats.set(t.driverId, s);
  }

  const rows: DriverRow[] = drivers.map((d) => ({
    ...d,
    subcoName: subcoName.get(d.subcoId),
    trips: stats.get(d.id)?.trips ?? 0,
    km: stats.get(d.id)?.km ?? 0,
    lastTrip: stats.get(d.id)?.last ?? null,
  }));


  return (
    <PageShell>
      <PageHeader
        eyebrow="Roster"
        title="Drivers"
        description="Issue a badge for each driver to scan in."
        icon={<Users className="h-5 w-5" />}
        actions={
          <Link
            href="/drivers/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            New driver
          </Link>
        }
      />


      <DriversList drivers={rows} showSubco={isGeneralAdmin} />
    </PageShell>
  );
}
