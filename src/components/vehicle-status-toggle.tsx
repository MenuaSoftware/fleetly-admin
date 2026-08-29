"use client";

import { useState } from "react";
import { Loader2, Wrench, CircleCheck } from "lucide-react";
import { setVehicleStatusAction } from "@/app/vehicles/actions";
import { StatusPill } from "@/components/page-kit";
import { Button } from "@/components/ui/button";

/**
 * Owns both the control and the displayed status — see the note on
 * driver-status-toggle.tsx for why the surrounding card deliberately
 * does not render its own status pill alongside this.
 */
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

  const active = status === "active";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone={active ? "ok" : "warn"}>{active ? "in service" : "out of service"}</StatusPill>
      <Button type="button" variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : active ? <Wrench /> : <CircleCheck />}
        {isPending ? "Updating…" : active ? "Take out of service" : "Return to service"}
      </Button>
      {error && <span className="w-full text-xs text-bad">{error}</span>}
    </div>
  );
}
