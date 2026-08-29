import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { DriverSummary, StaffMe, VehicleSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { ReconcileTripForm } from "@/components/reconcile-trip-form";

/**
 * product-brief.md §24, "Manual Outage Fallback" — when Fleetly (app or
 * API) was down, the depot records driver/vehicle/mileage/timestamp on
 * paper; once it's back, "Dispatcher enters missing records" through
 * this screen. StaffOnly on the backend, no extra gate here — same as
 * every other dispatcher-facing screen.
 */
export default async function ReconcileTripPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);

  const [drivers, vehicles] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers"),
    apiFetch<VehicleSummary[]>("/vehicles"),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Link href="/trips" className="mb-4 inline-block text-sm text-ink-2 hover:text-ink">
          ← Trips
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
    </main>
  );
}
