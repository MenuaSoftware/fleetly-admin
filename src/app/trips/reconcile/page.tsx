import { Wrench } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DriverSummary, VehicleSummary } from "@/lib/types";
import { ReconcileTripForm } from "@/components/reconcile-trip-form";
import { BackLink, PageHeader, PageShell, SectionCard } from "@/components/page-kit";

/**
 * product-brief.md §24, "Manual Outage Fallback" — when Fleetly (app or
 * API) was down, the depot records driver/vehicle/mileage/timestamp on
 * paper; once it's back, "Dispatcher enters missing records" through
 * this screen. StaffOnly on the backend, no extra gate here — same as
 * every other dispatcher-facing screen.
 */
export default async function ReconcileTripPage() {
  const [drivers, vehicles] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers"),
    apiFetch<VehicleSummary[]>("/vehicles"),
  ]);

  return (
    <PageShell width="narrow">
      <BackLink href="/trips">Trips</BackLink>
      <PageHeader
        eyebrow="Outage fallback"
        title="Reconcile a trip"
        description="For a trip recorded on paper during an outage — no photos or confirmations, marked manually reconciled."
        icon={<Wrench className="h-5 w-5" />}
      />
      <SectionCard>
        <ReconcileTripForm drivers={drivers} vehicles={vehicles} />
      </SectionCard>
    </PageShell>
  );
}
