"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { RetentionEnforcementResult, RetentionPolicySummary } from "@/lib/types";

export interface SetPolicyResult {
  policy?: RetentionPolicySummary;
  error?: string;
}

/**
 * retention.controller.ts's setPolicy() is @GeneralAdminOnly() — RLS
 * (retention_policy_write/_update, is_general_admin() only) is the
 * actual enforcement regardless, the decorator just gives a clean 403
 * instead of a silent RLS no-op. No revalidatePath()/router.refresh()
 * needed: the caller (retention-policy-manager.tsx) owns its own list
 * state and applies the returned policy directly, same pattern as
 * trip-share-manager.tsx.
 */
export async function setRetentionPolicyAction(
  dataType: string,
  retentionDays: number,
): Promise<SetPolicyResult> {
  try {
    const policy = await apiFetch<RetentionPolicySummary>(`/retention/${dataType}`, {
      method: "PUT",
      body: { retentionDays },
    });
    return { policy };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not save this retention policy.";
    return { error: message };
  }
}

export interface EnforceResult {
  results?: RetentionEnforcementResult[];
  error?: string;
}

/**
 * retention.controller.ts's enforce() runs one enforcement pass on
 * demand — there's no scheduler wired into this deployment yet (see
 * that controller's own comment), so this button IS the mechanism for
 * now, not a placeholder for one.
 */
export async function runRetentionEnforcementAction(): Promise<EnforceResult> {
  try {
    const results = await apiFetch<RetentionEnforcementResult[]>("/retention/enforce", {
      method: "POST",
    });
    return { results };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not run retention enforcement.";
    return { error: message };
  }
}
