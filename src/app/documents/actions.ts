"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { DocumentSummary } from "@/lib/types";

export interface ListDocumentsResult {
  documents?: DocumentSummary[];
  error?: string;
}

/**
 * Fetched on demand when the entity picker's selection changes, not
 * upfront for every vehicle/driver — document.controller.ts's list()
 * already supports exactly this query shape (?vehicleId= or ?driverId=).
 */
export async function listDocumentsAction(
  entity: { vehicleId: string } | { driverId: string },
): Promise<ListDocumentsResult> {
  try {
    const query = "vehicleId" in entity ? `vehicleId=${entity.vehicleId}` : `driverId=${entity.driverId}`;
    const documents = await apiFetch<DocumentSummary[]>(`/documents?${query}`);
    return { documents };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not load documents.";
    return { error: message };
  }
}

export interface CreateIntentResult {
  intent?: { documentId: string; path: string; token: string; uploadUrl: string };
  error?: string;
}

export interface CreateDocumentInput {
  typeId: string;
  vehicleId?: string;
  driverId?: string;
  expiryDate: string;
  mimeType: string;
  byteSize: number;
  checksum: string;
  originalFilename: string;
}

/**
 * document.controller.ts's own three-step flow (ask for a signed slot,
 * PUT the bytes straight to Storage, confirm) — same shape as every
 * other signed-upload flow in this codebase. The PUT itself happens
 * client-side in document-manager.tsx, straight to Supabase Storage,
 * not through this Server Action or the NestJS API — the signed URL is
 * exactly for bypassing both.
 */
export async function createDocumentIntentAction(input: CreateDocumentInput): Promise<CreateIntentResult> {
  try {
    const intent = await apiFetch<{ documentId: string; path: string; token: string; uploadUrl: string }>(
      "/documents",
      { method: "POST", body: input },
    );
    return { intent };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not prepare this upload.";
    return { error: message };
  }
}

export interface DocumentActionResult {
  document?: DocumentSummary;
  error?: string;
}

export async function confirmDocumentAction(id: string): Promise<DocumentActionResult> {
  try {
    const document = await apiFetch<DocumentSummary>(`/documents/${id}/confirm`, { method: "POST" });
    return { document };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not confirm this upload.";
    return { error: message };
  }
}

export interface RowActionResult {
  error?: string;
}

export async function deleteDocumentAction(id: string): Promise<RowActionResult> {
  try {
    await apiFetch(`/documents/${id}`, { method: "DELETE" });
    return {};
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not delete this document.";
    return { error: message };
  }
}

export interface ViewUrlResult {
  url?: string;
  error?: string;
}

export async function getDocumentViewUrlAction(id: string): Promise<ViewUrlResult> {
  try {
    const result = await apiFetch<{ url: string }>(`/documents/${id}/view-url`);
    return { url: result.url };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not load this document.";
    return { error: message };
  }
}
