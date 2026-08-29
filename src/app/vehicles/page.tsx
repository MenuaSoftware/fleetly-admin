import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { VehicleSummary, SubcontractorSummary } from "@/lib/types";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";

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

  return (
    <div className="mx-auto w-full max-w-3xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Vehicles</h1>
          <p className="text-sm text-ink-3">Any driver may take any vehicle in service.</p>
        </div>
        <Link
          href="/vehicles/new"
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
        >
          <Plus className="h-4 w-4" />
          New vehicle
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <Truck className="h-8 w-8 text-ink-3" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">No vehicles yet. Add the first one.</p>
          </div>
        ) : (
          <ul>
            {vehicles.map((v, i) => (
              <li
                key={v.id}
                className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-wash ${
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
  );
}
