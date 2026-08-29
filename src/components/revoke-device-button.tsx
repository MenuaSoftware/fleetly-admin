"use client";

import { useState } from "react";
import { revokeDeviceAction } from "@/app/drivers/actions";

/**
 * Only rendered when a driver has a real approvedDeviceId — the "lost
 * phone" flow, distinct from /devices' pending-enrollment reject.
 * Self-contained local state, same as issue-badge-button.tsx: no
 * revalidatePath/router.refresh() needed, this row simply stops
 * offering the button once revoked.
 */
export function RevokeDeviceButton({ deviceId }: { deviceId: string }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "revoked" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleRevoke() {
    setState({ kind: "loading" });
    const result = await revokeDeviceAction(deviceId);
    if (result.error) {
      setState({ kind: "error", message: result.error });
      return;
    }
    setState({ kind: "revoked" });
  }

  if (state.kind === "revoked") {
    return <span className="text-xs text-ink-3">Device revoked</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleRevoke}
        disabled={state.kind === "loading"}
        className="rounded-lg border border-bad/30 px-3 py-1.5 text-xs font-medium text-bad transition-colors hover:bg-bad-bg disabled:opacity-60"
      >
        {state.kind === "loading" ? "Revoking…" : "Revoke device"}
      </button>
      {state.kind === "error" && <span className="text-xs text-bad">{state.message}</span>}
    </div>
  );
}
