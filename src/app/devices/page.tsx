import { apiFetch } from "@/lib/api";
import { PendingDeviceSummary } from "@/lib/types";
import { PendingDevicesList } from "@/components/pending-devices-list";

/**
 * StaffOnly on the backend (device_access RLS scopes it per dispatcher/
 * general_admin, same as Drivers/Vehicles) — any signed-in staff member
 * can reach this, not just general admins.
 */
export default async function DevicesPage() {
  const devices = await apiFetch<PendingDeviceSummary[]>("/devices/pending");

  return (
    <div className="mx-auto w-full max-w-3xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Devices</h1>
        <p className="text-sm text-ink-3">
          A driver can&rsquo;t sign in until their phone is approved here.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        <PendingDevicesList devices={devices} />
      </div>
    </div>
  );
}
