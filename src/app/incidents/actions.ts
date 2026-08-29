"use server";

import { apiFetch, ApiError } from "@/lib/api";

export interface IncidentPhotoSummary {
  id: string;
  status: string;
  uploadedAt: string | null;
}

export interface ListIncidentPhotosResult {
  photos?: IncidentPhotoSummary[];
  error?: string;
}

/**
 * incident-photo.controller.ts's list()/getViewUrl() — both
 * @Authenticated() (not @DriverOnly()), since a dispatcher reviewing an
 * incident needs to see its photos, same reasoning as
 * damage-photo-gallery.tsx's own on-demand fetch.
 */
export async function listIncidentPhotosAction(incidentId: string): Promise<ListIncidentPhotosResult> {
  try {
    const photos = await apiFetch<IncidentPhotoSummary[]>(`/incidents/${incidentId}/photos`);
    return { photos };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not load photos for this incident.";
    return { error: message };
  }
}

export interface PhotoViewUrlResult {
  url?: string;
  error?: string;
}

export async function getIncidentPhotoViewUrlAction(
  incidentId: string,
  photoId: string,
): Promise<PhotoViewUrlResult> {
  try {
    const result = await apiFetch<{ url: string }>(`/incidents/${incidentId}/photos/${photoId}/view-url`);
    return { url: result.url };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not load this photo.";
    return { error: message };
  }
}
