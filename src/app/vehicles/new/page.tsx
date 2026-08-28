import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { CreateVehicleForm } from "@/components/create-vehicle-form";

export default async function NewVehiclePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const isGeneralAdmin = me?.role === "general_admin";

  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={isGeneralAdmin} />
      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">New vehicle</h1>
          <p className="text-sm text-ink-3">Add it to the fleet.</p>
        </div>
        <CreateVehicleForm subcontractors={subcontractors} />
      </div>
    </main>
  );
}
