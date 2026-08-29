"use client";

import { useState } from "react";
import { setDriverStatusAction } from "@/app/drivers/actions";

/** Same toggle-with-local-state pattern as vehicle-status-toggle.tsx. */
export function DriverStatusToggle({
  driverId,
  status: initialStatus,
}: {
  driverId: string;
  status: "active" | "inactive";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextStatus = status === "active" ? "inactive" : "active";
    setIsPending(true);
    setError(null);
    const result = await setDriverStatusAction(driverId, nextStatus);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(nextStatus);
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-1 font-mono text-xs ${
          status === "active" ? "bg-ok-bg text-ok" : "bg-wash text-ink-3"
        }`}
      >
        {status}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
      >
        {isPending ? "Updating…" : status === "active" ? "Deactivate" : "Reactivate"}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </div>
  );
}
