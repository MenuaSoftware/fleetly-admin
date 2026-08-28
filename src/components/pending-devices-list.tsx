"use client";

import { useState } from "react";
import { approveDeviceAction, rejectDeviceAction } from "@/app/devices/actions";
import { PendingDeviceSummary } from "@/lib/types";

type RowState = { kind: "idle" } | { kind: "loading"; action: "approve" | "reject" } | { kind: "error"; message: string };

/**
 * A client component managing the whole list (not one useState per
 * row) so a successful approve/reject can remove that row from local
 * state directly — revalidatePath() in the Server Action keeps the
 * cached route fresh for the *next* load, but doesn't by itself
 * re-render this already-mounted list, and re-fetching just to remove
 * one row is more roundtrip than this needs.
 *
 * Plain async onClick handlers, not useTransition — useTransition
 * wrapping a Server Action call silently never reached the server at
 * all when tried here before (see vehicle-status-toggle.tsx's own
 * history); this matches the pattern that's actually proven to work.
 */
export function PendingDevicesList({ devices: initial }: { devices: PendingDeviceSummary[] }) {
  const [devices, setDevices] = useState(initial);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  async function handleApprove(deviceId: string) {
    setRowState((s) => ({ ...s, [deviceId]: { kind: "loading", action: "approve" } }));
    const result = await approveDeviceAction(deviceId);
    if (result.error) {
      setRowState((s) => ({ ...s, [deviceId]: { kind: "error", message: result.error! } }));
      return;
    }
    setDevices((list) => list.filter((d) => d.id !== deviceId));
  }

  async function handleReject(deviceId: string) {
    setRowState((s) => ({ ...s, [deviceId]: { kind: "loading", action: "reject" } }));
    const result = await rejectDeviceAction(deviceId);
    if (result.error) {
      setRowState((s) => ({ ...s, [deviceId]: { kind: "error", message: result.error! } }));
      return;
    }
    setDevices((list) => list.filter((d) => d.id !== deviceId));
  }

  if (devices.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-ink-3">
        No phones waiting on approval right now.
      </p>
    );
  }

  return (
    <ul>
      {devices.map((d, i) => {
        const state = rowState[d.id] ?? { kind: "idle" };
        const isLoading = state.kind === "loading";
        return (
          <li
            key={d.id}
            className={`flex items-center justify-between gap-4 px-5 py-3.5 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                {d.driverFirstName} {d.driverLastName}
              </p>
              <p className="text-xs text-ink-3">
                Requested {new Date(d.requestedAt).toLocaleString()}
              </p>
              {state.kind === "error" && (
                <p role="alert" className="mt-1 text-xs text-bad">
                  {state.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReject(d.id)}
                disabled={isLoading}
                className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
              >
                {isLoading && state.action === "reject" ? "Rejecting…" : "Reject"}
              </button>
              <button
                type="button"
                onClick={() => handleApprove(d.id)}
                disabled={isLoading}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
              >
                {isLoading && state.action === "approve" ? "Approving…" : "Approve"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
