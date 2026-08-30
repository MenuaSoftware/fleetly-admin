"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { NotificationSummary } from "@/lib/types";

/**
 * notification.controller.ts's list() — @StaffOnly(), subco-wide (no
 * per-staff-user scoping, per that controller's own comment), so this
 * count is the same for every dispatcher/admin at a subcontractor, not
 * a personal inbox count. Used by sidebar-nav.tsx's badge, which calls
 * this from a client component on mount/navigation — a Server Action is
 * what makes that possible without building a CORS story for the API
 * (api.ts's apiFetch is otherwise server-only by design).
 */
export async function getUnreadNotificationCountAction(): Promise<number> {
  try {
    const unread = await apiFetch<NotificationSummary[]>("/notifications?unread=true");
    return unread.length;
  } catch {
    // A signed-out visitor or a transient API hiccup shouldn't crash the
    // header's badge — worst case it just doesn't show a count.
    return 0;
  }
}

export interface NotificationFeed {
  unread: number;
  /** Newest first, capped — this drives a dropdown, not a full page. */
  recent: NotificationSummary[];
}

/**
 * One call for the topbar bell: the unread count and the newest few
 * notifications behind it.
 *
 * The bell polls this, so it deliberately returns both in a single
 * round trip rather than making the client fetch a count and then a
 * list. Cap is small because the dropdown shows a preview and links to
 * /notifications for the rest.
 *
 * Like the count above, this is subco-wide rather than a personal
 * inbox — notification_read has no per-staff-user scoping, per
 * notification.controller.ts's own comment.
 */
export async function getNotificationFeedAction(): Promise<NotificationFeed> {
  try {
    const all = await apiFetch<NotificationSummary[]>("/notifications");
    const sorted = [...all].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      unread: sorted.filter((n) => n.readAt === null).length,
      recent: sorted.slice(0, 8),
    };
  } catch {
    // A transient API hiccup shouldn't take the topbar down; the bell
    // simply keeps its previous state until the next poll succeeds.
    return { unread: 0, recent: [] };
  }
}

export interface MarkReadResult {
  error?: string;
}

export async function markNotificationReadAction(id: string): Promise<MarkReadResult> {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    return {};
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not mark this notification as read.";
    return { error: message };
  }
}
