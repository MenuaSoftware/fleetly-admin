import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, PendingDeviceSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { PendingDevicesList } from "@/components/pending-devices-list";

/**
 * StaffOnly on the backend (device_access RLS scopes it per dispatcher/
 * general_admin, same as Drivers/Vehicles) — any signed-in staff member
 * can reach this, not just general admins.
 */
export default async function DevicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const devices = await apiFetch<PendingDeviceSummary[]>("/devices/pending");

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Devices</h1>
          <p className="text-sm text-ink-3">
            A driver can&rsquo;t sign in until their phone is approved here.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <PendingDevicesList devices={devices} />
        </div>
      </div>
    </main>
  );
}
