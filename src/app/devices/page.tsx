import { Smartphone } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PendingDeviceSummary } from "@/lib/types";
import { PendingDevicesList } from "@/components/pending-devices-list";
import { PageHeader, PageShell, SectionCard } from "@/components/page-kit";

/**
 * StaffOnly on the backend (device_access RLS scopes it per dispatcher/
 * general_admin, same as Drivers/Vehicles) — any signed-in staff member
 * can reach this, not just general admins.
 */
export default async function DevicesPage() {
  const devices = await apiFetch<PendingDeviceSummary[]>("/devices/pending");

  return (
    <PageShell width="medium">
      <PageHeader
        eyebrow="Access"
        title="Devices"
        description="A driver can’t sign in until their phone is approved here."
        icon={<Smartphone className="h-5 w-5" />}
      />

      {devices.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-warn/25 bg-warn-bg px-3.5 py-2.5 text-xs text-warn">
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-mono font-semibold">{devices.length}</span>{" "}
            {devices.length === 1 ? "device is" : "devices are"} waiting for approval.
          </span>
        </div>
      )}

      <SectionCard title="Pending enrolments" icon={<Smartphone className="h-4 w-4" />} flush>
        <PendingDevicesList devices={devices} />
      </SectionCard>
    </PageShell>
  );
}
