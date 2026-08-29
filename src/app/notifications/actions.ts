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
