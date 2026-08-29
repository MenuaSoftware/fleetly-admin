import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserCog } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { StaffSummary, SubcontractorSummary } from "@/lib/types";
import { StaffStatusToggle } from "@/components/staff-status-toggle";

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
    <div className="mx-auto w-full max-w-3xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Staff</h1>
          <p className="text-sm text-ink-3">Dispatchers and general admins.</p>
        </div>
        <Link
          href="/staff/invite"
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-strong"
        >
          <Plus className="h-4 w-4" />
          Invite staff
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UserCog className="h-8 w-8 text-ink-3" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">No staff yet. Invite the first dispatcher to get started.</p>
          </div>
        ) : (
          <ul>
            {staff.map((s, i) => (
              <li
                key={s.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-wash ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-ink-3">
                    {s.subcoId ? subcoName.get(s.subcoId) ?? "Unknown subcontractor" : "All subcontractors"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-2">{ROLE_LABEL[s.role]}</span>
                  <StaffStatusToggle staffId={s.id} status={s.status} isSelf={s.id === me?.staffUserId} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
