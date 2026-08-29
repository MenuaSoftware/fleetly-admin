import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { NotificationSummary } from "@/lib/types";
import { NotificationList } from "@/components/notification-list";
import { PageHeader, PageShell, SectionCard } from "@/components/page-kit";

/**
 * notification.controller.ts's own comment: "subco-wide (notification_read
 * has no per-staff-user scoping), matching a small subcontractor's
 * dispatcher panel rather than an individual inbox" — so this is visible
 * to any staff member (NAV_LINKS, not GENERAL_ADMIN_NAV_LINKS), and every
 * dispatcher/admin at a subco sees the same list.
 */
export default async function NotificationsPage() {
  const notifications = await apiFetch<NotificationSummary[]>("/notifications");
  const unread = notifications.filter((n) => n.readAt === null).length;

  return (
    <PageShell width="medium">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Incidents and expiring documents for this subcontractor."
        icon={<Bell className="h-5 w-5" />}
      />

      {notifications.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="font-mono text-ink">{unread}</span> unread
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="font-mono text-ink">{notifications.length}</span> total
          </span>
        </div>
      )}

      <SectionCard flush>
        <NotificationList notifications={notifications} />
      </SectionCard>
    </PageShell>
  );
}
