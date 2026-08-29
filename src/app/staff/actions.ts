"use server";

import { apiFetch, ApiError } from "@/lib/api";

export interface SetStaffStatusResult {
  status?: string;
  error?: string;
}

/**
 * staff.controller.ts's setStatus() is the real authority — "You cannot
 * change your own account status" (403) comes back as-is via
 * ApiError.message, not re-worded here. The UI's own row for the
 * signed-in admin disables the toggle preemptively (staff-status-toggle.tsx),
 * this is the backend's own backstop regardless.
 */
export async function setStaffStatusAction(
  id: string,
  status: "active" | "inactive",
): Promise<SetStaffStatusResult> {
  try {
    const result = await apiFetch<{ status: string }>(`/staff/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    return { status: result.status };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not change this account's status.";
    return { error: message };
  }
}
