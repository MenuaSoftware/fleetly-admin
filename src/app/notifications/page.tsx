import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { NotificationSummary, StaffMe } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { NotificationList } from "@/components/notification-list";

/**
 * notification.controller.ts's own comment: "subco-wide (notification_read
 * has no per-staff-user scoping), matching a small subcontractor's
 * dispatcher panel rather than an individual inbox" — so this is visible
 * to any staff member (NAV_LINKS, not GENERAL_ADMIN_NAV_LINKS), and every
 * dispatcher/admin at a subco sees the same list.
 */
export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const notifications = await apiFetch<NotificationSummary[]>("/notifications");

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Notifications</h1>
          <p className="text-sm text-ink-3">Incidents and expiring documents for this subcontractor.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          <NotificationList notifications={notifications} />
        </div>
      </div>
    </main>
  );
}
