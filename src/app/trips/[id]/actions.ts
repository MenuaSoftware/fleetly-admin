"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { TripAmendmentSummary } from "@/lib/types";

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

export interface ShareActionResult {
  id?: string;
  error?: string;
}

/**
 * trip-share.controller.ts's grant()/revoke() are the real authority —
 * this just calls them. "Only the trip's own subcontractor can share
 * it" and "A trip cannot be shared with its own subcontractor" (403/400)
 * come back as-is via ApiError.message, not re-worded here.
 */
export async function grantShareAction(tripId: string, grantedToSubcoId: string): Promise<ShareActionResult> {
  try {
    const result = await apiFetch<{ id: string }>(`/trips/${tripId}/share`, {
      method: "POST",
      body: { grantedToSubcoId },
    });
    return { id: result.id };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not share this trip.";
    return { error: message };
  }
}

export async function revokeShareAction(tripId: string, subcoId: string): Promise<ShareActionResult> {
  try {
    await apiFetch(`/trips/${tripId}/share/${subcoId}/revoke`, { method: "POST" });
    return {};
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not revoke this share.";
    return { error: message };
  }
}

export interface AmendResult {
  // trip-amendment.controller.ts's own AmendmentResponse — id/field/
  // oldValue/newValue only, no reason/createdAt (those aren't echoed
  // back; the caller already has `reason`, and supplies its own
  // createdAt for local-state display, same as trip-share-manager.tsx's
  // own optimistic-update pattern).
  amendment?: { id: string; field: string; oldValue: string | null; newValue: string };
  error?: string;
}

/**
 * trip-amendment.controller.ts's amend() is the real authority —
 * "Only a closed trip can be amended" (active) and "This trip has no
 * closure reason to amend" (completed, not force_closed) come back
 * as-is via ApiError.message. field/value/reason match that
 * controller's own AmendTripDto exactly.
 */
export async function amendTripAction(
  tripId: string,
  field: TripAmendmentSummary["field"],
  value: string,
  reason: string,
): Promise<AmendResult> {
  try {
    const amendment = await apiFetch<{ id: string; field: string; oldValue: string | null; newValue: string }>(
      `/trips/${tripId}/amend`,
      { method: "POST", body: { field, value, reason } },
    );
    return { amendment };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not amend this trip.";
    return { error: message };
  }
}
