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
