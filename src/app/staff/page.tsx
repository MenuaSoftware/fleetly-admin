import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, StaffSummary, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { StaffStatusToggle } from "@/components/staff-status-toggle";

const ROLE_LABEL: Record<StaffSummary["role"], string> = {
  dispatcher: "Dispatcher",
  general_admin: "General admin",
};

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
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
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Staff</h1>
            <p className="text-sm text-ink-3">Dispatchers and general admins.</p>
          </div>
          <Link
            href="/staff/invite"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Invite staff
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {staff.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-3">
              No staff yet. Invite the first dispatcher to get started.
            </p>
          ) : (
            <ul>
              {staff.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${
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
    </main>
  );
}
