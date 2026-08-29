"use server";

import { randomUUID } from "crypto";
import { apiFetch, ApiError } from "@/lib/api";

export interface ReconcileTripInput {
  driverId: string;
  vehicleId: string;
  startOdometer: number;
  endOdometer: number;
  startedAt: string;
  endedAt: string;
  reasonNote: string;
}

export interface ReconcileTripResult {
  id?: string;
  error?: string;
}

/**
 * docs/product-brief.md §24, "Manual Outage Fallback": when the app or
 * API was down, the depot keeps records on paper (driver, vehicle,
 * scanner, mileage, timestamp), and once Fleetly is back "Dispatcher
 * enters missing records" through this exact admin-panel screen — the
 * doc's own diagram is explicit this is a real, intended path, not a
 * workaround: "Do not mistake the web admin panel for an outage
 * fallback because it depends on the same API" is about the panel
 * itself needing the API up, not about this feature being unofficial.
 * trip.controller.ts's reconcile() is the real authority (StaffOnly,
 * origin stamped 'manual_reconciliation', reasonNote required).
 */
export async function reconcileTripAction(input: ReconcileTripInput): Promise<ReconcileTripResult> {
  try {
    const result = await apiFetch<{ id: string }>("/trips/reconcile", {
      method: "POST",
      body: { ...input, idempotencyKey: randomUUID() },
    });
    return { id: result.id };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Could not reconcile this trip.";
    return { error: message };
  }
}
