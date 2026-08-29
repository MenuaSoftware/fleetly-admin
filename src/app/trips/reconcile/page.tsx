import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DriverSummary, VehicleSummary } from "@/lib/types";
import { ReconcileTripForm } from "@/components/reconcile-trip-form";

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
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/trips"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Trips
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Reconcile a trip</h1>
        <p className="text-sm text-ink-3">
          For a trip recorded on paper during an outage — no photos or confirmations, marked manually
          reconciled.
        </p>
      </div>

      <ReconcileTripForm drivers={drivers} vehicles={vehicles} />
    </div>
  );
}
