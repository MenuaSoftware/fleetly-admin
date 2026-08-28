import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, VehicleSummary, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";

const BODY_TYPE_LABEL: Record<VehicleSummary["bodyType"], string> = {
  van: "Van",
  truck: "Truck",
  car: "Car",
};

export default async function VehiclesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const isGeneralAdmin = me?.role === "general_admin";

  const [vehicles, subcontractors] = await Promise.all([
    apiFetch<VehicleSummary[]>("/vehicles"),
    isGeneralAdmin ? apiFetch<SubcontractorSummary[]>("/subcontractors") : Promise.resolve([]),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={isGeneralAdmin} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Vehicles</h1>
            <p className="text-sm text-ink-3">Any driver may take any vehicle in service.</p>
          </div>
          <Link
            href="/vehicles/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            New vehicle
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {vehicles.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-3">
              No vehicles yet. Add the first one.
            </p>
          ) : (
            <ul>
              {vehicles.map((v, i) => (
                <li
                  key={v.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-ink">{v.plate}</p>
                    <p className="text-xs text-ink-3">
                      {BODY_TYPE_LABEL[v.bodyType]}
                      {isGeneralAdmin
                        ? ` · ${subcoName.get(v.subcoId) ?? "Unknown subcontractor"}`
                        : ""}
                    </p>
                  </div>
                  <VehicleStatusToggle vehicleId={v.id} status={v.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
