"use client";

import { useState } from "react";
import { transitionDamageAction } from "@/app/trips/[id]/actions";
import { TripDamageSummary } from "@/lib/types";
import { DamagePhotoGallery } from "@/components/damage-photo-gallery";

const VIEW_LABEL: Record<string, string> = {
  front: "Front",
  left: "Left side",
  right: "Right side",
  rear: "Rear",
};

const STATUS_BADGE: Record<string, string> = {
  reported: "bg-warn-bg text-warn",
  accepted: "bg-wash text-ink-2",
  dismissed: "bg-wash text-ink-3",
  repaired: "bg-ok-bg text-ok",
};

/**
 * Owns its own list state so a successful accept/dismiss/repair
 * updates that row's status in place — same reasoning as
 * pending-devices-list.tsx, plain async handlers rather than
 * useTransition (see vehicle-status-toggle.tsx's own history for why).
 */
export function DamageList({ vehicleId, damage: initial }: { vehicleId: string; damage: TripDamageSummary[] }) {
  const [damage, setDamage] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleTransition(damageId: string, action: "accept" | "dismiss" | "repair") {
    setPendingId(damageId);
    setErrors((e) => ({ ...e, [damageId]: "" }));
    const result = await transitionDamageAction(vehicleId, damageId, action);
    setPendingId(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [damageId]: result.error! }));
      return;
    }
    setDamage((list) =>
      list.map((d) => (d.id === damageId ? { ...d, status: result.status ?? d.status } : d)),
    );
  }

  return (
    <ul>
      {damage.map((d, i) => (
        <li key={d.id} className={`px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink">
                {VIEW_LABEL[d.view] ?? d.view}
                {d.reportedPhase ? <span className="text-ink-3"> · {d.reportedPhase.replaceAll("_", " ")}</span> : null}
              </p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-mono text-xs ${STATUS_BADGE[d.status] ?? "bg-wash text-ink-2"}`}>
                {d.status}
              </span>
              <div className="mt-1.5">
                <DamagePhotoGallery vehicleId={vehicleId} damageId={d.id} />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {d.status === "reported" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleTransition(d.id, "dismiss")}
                    disabled={pendingId === d.id}
                    className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransition(d.id, "accept")}
                    disabled={pendingId === d.id}
                    className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                  >
                    Accept
                  </button>
                </>
              )}
              {d.status === "accepted" && (
                <button
                  type="button"
                  onClick={() => handleTransition(d.id, "repair")}
                  disabled={pendingId === d.id}
                  className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                >
                  Mark repaired
                </button>
              )}
            </div>
          </div>
          {errors[d.id] && (
            <p role="alert" className="mt-1.5 text-xs text-bad">
              {errors[d.id]}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
