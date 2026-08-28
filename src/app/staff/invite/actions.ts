"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

export interface InviteState {
  error: string | null;
}

export async function inviteStaffAction(
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const email = String(formData.get("email") ?? "");
  const firstName = String(formData.get("firstName") ?? "");
  const lastName = String(formData.get("lastName") ?? "");
  const role = String(formData.get("role") ?? "");
  const subcoId = String(formData.get("subcoId") ?? "");

  try {
    await apiFetch("/staff/invite", {
      method: "POST",
      body: {
        email,
        firstName,
        lastName,
        role,
        // Omitted rather than sent empty — the API's own DTO validation
        // (@IsOptional @IsUUID) rejects an empty string, and the
        // general_admin case must omit this field entirely, not send "".
        ...(role === "dispatcher" && subcoId ? { subcoId } : {}),
      },
    });
  } catch (err) {
    // The API's own message is already the admin-facing text — see
    // apiFetch's own reasoning. Passed through, not replaced.
    const message = err instanceof ApiError ? err.message : "Could not send the invite.";
    return { error: message };
  }

  redirect("/staff");
}
