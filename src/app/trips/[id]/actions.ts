"use server";

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
