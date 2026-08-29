"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";

export interface SubcontractorActionResult {
  subcontractor?: SubcontractorSummary;
  error?: string;
}

/** subcontractor.controller.ts's create()/rename() — the onboarding step every other piece of this product depends on. */
export async function createSubcontractorAction(name: string): Promise<SubcontractorActionResult> {
  try {
    const subcontractor = await apiFetch<SubcontractorSummary>("/subcontractors", {
      method: "POST",
      body: { name },
    });
    return { subcontractor };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not create this subcontractor.";
    return { error: message };
  }
}

export async function renameSubcontractorAction(id: string, name: string): Promise<SubcontractorActionResult> {
  try {
    const subcontractor = await apiFetch<SubcontractorSummary>(`/subcontractors/${id}`, {
      method: "PATCH",
      body: { name },
    });
    return { subcontractor };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not rename this subcontractor.";
    return { error: message };
  }
}
