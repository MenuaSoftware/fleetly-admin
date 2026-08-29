import { apiFetch } from "@/lib/api";
import { NotificationSummary } from "@/lib/types";
import { NotificationList } from "@/components/notification-list";

/**
 * notification.controller.ts's own comment: "subco-wide (notification_read
 * has no per-staff-user scoping), matching a small subcontractor's
 * dispatcher panel rather than an individual inbox" — so this is visible
 * to any staff member (NAV_LINKS, not GENERAL_ADMIN_NAV_LINKS), and every
 * dispatcher/admin at a subco sees the same list.
 */
export default async function NotificationsPage() {
  const notifications = await apiFetch<NotificationSummary[]>("/notifications");

  return (
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Notifications</h1>
        <p className="text-sm text-ink-3">Incidents and expiring documents for this subcontractor.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}
