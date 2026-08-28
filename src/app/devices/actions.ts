"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";

export interface DeviceActionResult {
  error?: string;
}

export async function approveDeviceAction(deviceId: string): Promise<DeviceActionResult> {
  try {
    await apiFetch(`/devices/${deviceId}/approve`, { method: "POST" });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not approve this device.";
    return { error: message };
  }
  revalidatePath("/devices");
  return {};
}

export async function rejectDeviceAction(deviceId: string): Promise<DeviceActionResult> {
  try {
    await apiFetch(`/devices/${deviceId}/reject`, { method: "POST" });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not reject this device.";
    return { error: message };
  }
  revalidatePath("/devices");
  return {};
}
