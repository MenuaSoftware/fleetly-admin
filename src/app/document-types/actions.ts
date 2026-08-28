"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";

export interface DocumentTypeActionState {
  error: string | null;
}

export async function createDocumentTypeAction(
  _prevState: DocumentTypeActionState,
  formData: FormData,
): Promise<DocumentTypeActionState> {
  const attachedTo = String(formData.get("attachedTo") ?? "");
  const name = String(formData.get("name") ?? "");
  const alertWindowDays = Number(formData.get("alertWindowDays") ?? "");
  const subcoId = String(formData.get("subcoId") ?? "");

  try {
    await apiFetch("/document-types", {
      method: "POST",
      body: {
        attachedTo,
        name,
        alertWindowDays,
        ...(subcoId ? { subcoId } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not create this document type.";
    return { error: message };
  }
  revalidatePath("/document-types");
  return { error: null };
}

export interface RowActionResult {
  error?: string;
}

export async function updateDocumentTypeAction(
  id: string,
  input: { name: string; alertWindowDays: number },
): Promise<RowActionResult> {
  try {
    await apiFetch(`/document-types/${id}`, { method: "PATCH", body: input });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not update this document type.";
    return { error: message };
  }
  revalidatePath("/document-types");
  return {};
}

export async function deleteDocumentTypeAction(id: string): Promise<RowActionResult> {
  try {
    await apiFetch(`/document-types/${id}`, { method: "DELETE" });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not delete this document type.";
    return { error: message };
  }
  revalidatePath("/document-types");
  return {};
}

export async function cloneDefaultsAction(subcoId: string): Promise<RowActionResult> {
  try {
    await apiFetch("/document-types/clone", { method: "POST", body: { subcoId } });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not clone defaults for this subcontractor.";
    return { error: message };
  }
  revalidatePath("/document-types");
  return {};
}
