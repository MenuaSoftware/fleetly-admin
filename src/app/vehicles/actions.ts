"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

export interface CreateVehicleState {
  error: string | null;
}

export async function createVehicleAction(
  _prevState: CreateVehicleState,
  formData: FormData,
): Promise<CreateVehicleState> {
  const plate = String(formData.get("plate") ?? "");
  const bodyType = String(formData.get("bodyType") ?? "");
  const subcoId = String(formData.get("subcoId") ?? "");

  try {
    await apiFetch("/vehicles", {
      method: "POST",
      body: {
        plate,
        bodyType,
        ...(subcoId ? { subcoId } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not create the vehicle.";
    return { error: message };
  }

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export interface SetStatusResult {
  error?: string;
}

export async function setVehicleStatusAction(
  vehicleId: string,
  status: "active" | "out_of_service",
): Promise<SetStatusResult> {
  try {
    await apiFetch(`/vehicles/${vehicleId}/status`, { method: "PATCH", body: { status } });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not update the vehicle.";
    return { error: message };
  }
  revalidatePath("/vehicles");
  return {};
}
