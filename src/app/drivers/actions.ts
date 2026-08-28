"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

export interface IssueBadgeResult {
  badgeId?: string;
  token?: string;
  error?: string;
}

/**
 * Issues (or reissues — see driver.controller.ts's issueBadge: any
 * existing active badge is revoked first) a badge for one driver. The
 * raw token is the only place it ever exists outside the physical badge
 * itself — same warning the API's own code carries — so this is a
 * plain callback the UI shows once, not something stored or revisited.
 */
export async function issueBadgeAction(driverId: string): Promise<IssueBadgeResult> {
  try {
    const result = await apiFetch<{ badgeId: string; token: string }>(
      `/drivers/${driverId}/badge`,
      { method: "POST" },
    );
    return result;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not issue a badge.";
    return { error: message };
  }
}

export interface CreateDriverState {
  error: string | null;
}

export async function createDriverAction(
  _prevState: CreateDriverState,
  formData: FormData,
): Promise<CreateDriverState> {
  const firstName = String(formData.get("firstName") ?? "");
  const lastName = String(formData.get("lastName") ?? "");
  const subcoId = String(formData.get("subcoId") ?? "");

  try {
    await apiFetch("/drivers", {
      method: "POST",
      body: {
        firstName,
        lastName,
        // Omitted (not sent empty) for a dispatcher, who has no picker
        // at all — driver.controller.ts uses their own subco silently.
        ...(subcoId ? { subcoId } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not create the driver.";
    return { error: message };
  }

  revalidatePath("/drivers");
  redirect("/drivers");
}
