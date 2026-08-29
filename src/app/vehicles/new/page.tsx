import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { CreateVehicleForm } from "@/components/create-vehicle-form";

export default async function NewVehiclePage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/vehicles"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Vehicles
      </Link>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">New vehicle</h1>
        <p className="text-sm text-ink-3">Add it to the fleet.</p>
      </div>
      <CreateVehicleForm subcontractors={subcontractors} />
    </div>
  );
}
