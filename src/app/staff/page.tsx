import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserCog } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { StaffSummary, SubcontractorSummary } from "@/lib/types";
import { PageHeader, PageShell } from "@/components/page-kit";
import { StaffList, type StaffRow } from "@/components/staff-list";

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

  const rows: StaffRow[] = staff.map((s) => ({
    ...s,
    subcoName: s.subcoId ? subcoName.get(s.subcoId) : undefined,
  }));

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

      <StaffList staff={rows} selfId={me?.staffUserId} />
    </PageShell>
  );
}
