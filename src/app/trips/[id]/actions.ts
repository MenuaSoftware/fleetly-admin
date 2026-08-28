"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";

export interface PhotoViewUrlResult {
  url?: string;
  error?: string;
}

export async function getPhotoViewUrlAction(
  tripId: string,
  photoId: string,
): Promise<PhotoViewUrlResult> {
  try {
    const result = await apiFetch<{ url: string }>(`/trips/${tripId}/photos/${photoId}/view-url`);
    return { url: result.url };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not load this photo.";
    return { error: message };
  }
}

export interface ForceCloseInput {
  reasonCode: string;
  reasonNote?: string;
  endOdometer?: number;
}

export interface ForceCloseResult {
  error?: string;
}

/**
 * trip.controller.ts's forceClose() only accepts an already-active
 * trip and a fixed reasonCode enum — mirrored client-side by the form,
 * but the backend is what actually enforces both.
 */
export async function forceCloseTripAction(
  tripId: string,
  input: ForceCloseInput,
): Promise<ForceCloseResult> {
  try {
    await apiFetch(`/trips/${tripId}/force-close`, {
      method: "POST",
      body: {
        reasonCode: input.reasonCode,
        ...(input.reasonNote ? { reasonNote: input.reasonNote } : {}),
        ...(input.endOdometer !== undefined ? { endOdometer: input.endOdometer } : {}),
        idempotencyKey: randomUUID(),
      },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not force-close this trip.";
    return { error: message };
  }
  revalidatePath(`/trips/${tripId}`);
  return {};
}

export interface DamageActionResult {
  status?: string;
  error?: string;
}

/**
 * damage.controller.ts's transition() enforces the real state machine
 * (reported -> accepted -> repaired, or reported -> dismissed) — this
 * just calls whichever endpoint the button pressed, the backend is
 * what actually rejects an invalid transition (e.g. dismissing an
 * already-accepted report comes back as a 409, surfaced as-is).
 */
export async function transitionDamageAction(
  vehicleId: string,
  damageId: string,
  action: "accept" | "dismiss" | "repair",
): Promise<DamageActionResult> {
  try {
    const result = await apiFetch<{ status: string }>(
      `/vehicles/${vehicleId}/damage/${damageId}/${action}`,
      { method: "PATCH" },
    );
    return { status: result.status };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : `Could not ${action} this damage report.`;
    return { error: message };
  }
}
