import Link from "next/link";
import { Plus, Smartphone, Users } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { DriverSummary, SubcontractorSummary } from "@/lib/types";
import { IssueBadgeButton } from "@/components/issue-badge-button";
import { DriverStatusToggle } from "@/components/driver-status-toggle";
import { RevokeDeviceButton } from "@/components/revoke-device-button";
import { EmptyState, PageHeader, PageShell } from "@/components/page-kit";
import { EntityCard, EntityGrid, InitialsAvatar } from "@/components/entity-grid";

export default async function DriversPage() {
  const me = await getMe();
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

  const enrolled = drivers.filter((d) => d.approvedDeviceId).length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Roster"
        title="Drivers"
        description="Issue a badge for each driver to scan in."
        icon={<Users className="h-5 w-5" />}
        actions={
          <Link
            href="/drivers/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            New driver
          </Link>
        }
      />

      {drivers.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-mono text-ink">{drivers.length}</span> total
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            <span className="font-mono text-ink">{enrolled}</span> with a device
          </span>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No drivers yet"
            description="Add the first driver to issue their badge and let them scan in."
            action={
              <Link
                href="/drivers/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
              >
                <Plus className="h-4 w-4" />
                New driver
              </Link>
            }
          />
        </div>
      ) : (
        <EntityGrid>
          {drivers.map((d, i) => {
            const name = `${d.firstName} ${d.lastName}`;
            return (
              <EntityCard
                key={d.id}
                index={i}
                href={`/drivers/${d.id}`}
                avatar={<InitialsAvatar name={name} tone={d.status === "active" ? "brand" : "neutral"} />}
                title={name}
                subtitle={isGeneralAdmin ? (subcoName.get(d.subcoId) ?? "Unknown subcontractor") : undefined}
                dimmed={d.status !== "active"}
                meta={
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" />
                    {d.approvedDeviceId ? "Device enrolled" : "No device"}
                  </span>
                }
                actions={
                  <>
                    <DriverStatusToggle driverId={d.id} status={d.status} />
                    {d.approvedDeviceId ? (
                      <RevokeDeviceButton deviceId={d.approvedDeviceId} />
                    ) : (
                      <IssueBadgeButton driverId={d.id} />
                    )}
                  </>
                }
              />
            );
          })}
        </EntityGrid>
      )}
    </PageShell>
  );
}
