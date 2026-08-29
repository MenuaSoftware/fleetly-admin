import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, DriverSummary, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { IssueBadgeButton } from "@/components/issue-badge-button";
import { DriverStatusToggle } from "@/components/driver-status-toggle";
import { RevokeDeviceButton } from "@/components/revoke-device-button";

export default async function DriversPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const isGeneralAdmin = me?.role === "general_admin";

  const [drivers, subcontractors] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers"),
    // Only needed to label each row with its subcontractor when the
    // viewer can see drivers across more than one — a dispatcher's own
    // list is already scoped to their one subco by RLS, so skip the
    // extra round trip for them.
    isGeneralAdmin ? apiFetch<SubcontractorSummary[]>("/subcontractors") : Promise.resolve([]),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={isGeneralAdmin} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Drivers</h1>
            <p className="text-sm text-ink-3">Issue a badge for each driver to scan in.</p>
          </div>
          <Link
            href="/drivers/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            New driver
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {drivers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-3">
              No drivers yet. Add the first one to issue their badge.
            </p>
          ) : (
            <ul>
              {drivers.map((d, i) => (
                <li
                  key={d.id}
                  className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {d.firstName} {d.lastName}
                    </p>
                    {isGeneralAdmin && (
                      <p className="text-xs text-ink-3">
                        {subcoName.get(d.subcoId) ?? "Unknown subcontractor"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <DriverStatusToggle driverId={d.id} status={d.status} />
                    {d.approvedDeviceId ? (
                      <RevokeDeviceButton deviceId={d.approvedDeviceId} />
                    ) : (
                      <IssueBadgeButton driverId={d.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
