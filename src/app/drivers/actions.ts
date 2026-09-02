"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { badgeQrPayload, renderQrSvg } from "@/lib/qr-payload";

export interface IssueBadgeResult {
  badgeId?: string;
  token?: string;
  /**
   * The token rendered as a scannable QR, generated here rather than in
   * the browser so the QR encoder stays out of the client bundle. Same
   * one-time-only lifetime as `token` itself — it encodes it.
   */
  qrSvg?: string;
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
    return { ...result, qrSvg: await renderQrSvg(badgeQrPayload(result.token)) };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not issue a badge.";
    return { error: message };
  }
}

export interface SetDriverStatusResult {
  status?: string;
  error?: string;
}

/** driver.controller.ts's setStatus() — mirrors setVehicleStatusAction exactly. */
export async function setDriverStatusAction(
  driverId: string,
  status: "active" | "inactive",
): Promise<SetDriverStatusResult> {
  try {
    const result = await apiFetch<{ status: string }>(`/drivers/${driverId}/status`, {
      method: "PATCH",
      body: { status },
    });
    return { status: result.status };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not change this driver's status.";
    return { error: message };
  }
}

export interface RevokeDeviceResult {
  error?: string;
}

/**
 * device.controller.ts's revoke() — the "lost phone" flow, distinct
 * from /devices' own reject() (a still-pending enrollment attempt).
 * Lives here, not devices/actions.ts, since the entry point is a
 * driver's row on this page, not the pending-devices queue.
 */
export async function revokeDeviceAction(deviceId: string): Promise<RevokeDeviceResult> {
  try {
    await apiFetch(`/devices/${deviceId}/revoke`, { method: "POST" });
    return {};
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not revoke this device.";
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
