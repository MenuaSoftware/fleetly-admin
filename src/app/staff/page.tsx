import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ShieldCheck, UserCog } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { StaffSummary, SubcontractorSummary } from "@/lib/types";
import { StaffStatusToggle } from "@/components/staff-status-toggle";
import { EmptyState, PageHeader, PageShell, StatusPill } from "@/components/page-kit";
import { EntityCard, EntityGrid, InitialsAvatar } from "@/components/entity-grid";

const ROLE_LABEL: Record<StaffSummary["role"], string> = {
  dispatcher: "Dispatcher",
  general_admin: "General admin",
};

export default async function StaffPage() {
  const me = await getMe();
  // Same "RLS is the real enforcement, this is the good-UX layer" split
  // as the rest of the API: GET /staff would just come back empty for a
  // dispatcher (staff_user_admin_only RLS), so this redirect exists to
  // avoid showing an empty, confusing page — not to be the only thing
  // standing in the way.
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const [staff, subcontractors] = await Promise.all([
    apiFetch<StaffSummary[]>("/staff"),
    apiFetch<SubcontractorSummary[]>("/subcontractors"),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  return (
    <PageShell>
      <PageHeader
        eyebrow="Administration"
        title="Staff"
        description="Dispatchers and general admins."
        icon={<UserCog className="h-5 w-5" />}
        actions={
          <Link
            href="/staff/invite"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Invite staff
          </Link>
        }
      />

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<UserCog className="h-5 w-5" />}
            title="No staff yet"
            description="Invite the first dispatcher so someone other than you can run the panel."
            action={
              <Link
                href="/staff/invite"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
              >
                <Plus className="h-4 w-4" />
                Invite staff
              </Link>
            }
          />
        </div>
      ) : (
        <EntityGrid>
          {staff.map((s, i) => {
            const name = `${s.firstName} ${s.lastName}`;
            const isSelf = s.id === me?.staffUserId;
            return (
              <EntityCard
                key={s.id}
                index={i}
                href={`/staff/${s.id}`}
                avatar={<InitialsAvatar name={name} tone={s.role === "general_admin" ? "viz-2" : "info"} />}
                title={isSelf ? `${name} (you)` : name}
                subtitle={
                  s.subcoId ? (subcoName.get(s.subcoId) ?? "Unknown subcontractor") : "All subcontractors"
                }
                meta={
                  <StatusPill tone={s.role === "general_admin" ? "viz-2" : "info"}>
                    {s.role === "general_admin" && <ShieldCheck className="h-3 w-3" />}
                    {ROLE_LABEL[s.role]}
                  </StatusPill>
                }
                actions={<StaffStatusToggle staffId={s.id} status={s.status} isSelf={isSelf} />}
              />
            );
          })}
        </EntityGrid>
      )}
    </PageShell>
  );
}
