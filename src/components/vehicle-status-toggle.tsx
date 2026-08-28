"use client";

import { useState } from "react";
import { setVehicleStatusAction } from "@/app/vehicles/actions";

export function VehicleStatusToggle({
  vehicleId,
  status: initialStatus,
}: {
  vehicleId: string;
  status: "active" | "out_of_service";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextStatus = status === "active" ? "out_of_service" : "active";
    setIsPending(true);
    setError(null);
    const result = await setVehicleStatusAction(vehicleId, nextStatus);
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
          status === "active" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"
        }`}
      >
        {status === "active" ? "active" : "out of service"}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
      >
        {isPending
          ? "Updating…"
          : status === "active"
            ? "Take out of service"
            : "Return to service"}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </div>
  );
}
