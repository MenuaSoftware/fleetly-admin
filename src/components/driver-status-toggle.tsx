"use client";

import { useState } from "react";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { setDriverStatusAction } from "@/app/drivers/actions";
import { StatusPill } from "@/components/page-kit";
import { Button } from "@/components/ui/button";

/**
 * Same toggle-with-local-state pattern as vehicle-status-toggle.tsx.
 *
 * This component owns the *displayed* status as well as the control,
 * deliberately: it holds the live value after a toggle, so a second
 * status pill rendered by the surrounding card would go stale the
 * moment someone clicks. One source, one pill.
 */
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

  const active = status === "active";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone={active ? "ok" : "neutral"}>{status}</StatusPill>
      <Button type="button" variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : active ? (
          <UserX />
        ) : (
          <UserCheck />
        )}
        {isPending ? "Updating…" : active ? "Deactivate" : "Reactivate"}
      </Button>
      {error && <span className="w-full text-xs text-bad">{error}</span>}
    </div>
  );
}
