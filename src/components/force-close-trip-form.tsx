"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { forceCloseTripAction } from "@/app/trips/[id]/actions";

const REASON_CODES = [
  { value: "driver_unavailable", label: "Driver unavailable" },
  { value: "device_failure", label: "Device failure" },
  { value: "lost_phone_access", label: "Lost phone access" },
  { value: "vehicle_incident", label: "Vehicle incident" },
  { value: "other", label: "Other" },
] as const;

/**
 * Only ever shown for an active trip (trip.controller.ts's forceClose()
 * rejects anything else) — a dispatcher's way to close out a trip a
 * driver can't finish themselves (dead phone, no signal, incident).
 * Plain async handler, not useTransition — see vehicle-status-toggle.tsx's
 * own history for why that pattern is avoided here.
 */
export function ForceCloseTripForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonNote, setReasonNote] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!reasonCode) return;
    setIsSubmitting(true);
    setError(null);
    const odometer = endOdometer.trim() ? Number(endOdometer) : undefined;
    const result = await forceCloseTripAction(tripId, {
      reasonCode,
      reasonNote: reasonNote.trim() || undefined,
      endOdometer: odometer,
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-bad/30 px-4 py-2.5 text-sm font-medium text-bad transition-colors hover:bg-bad-bg"
      >
        Force close trip
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-bad/20 bg-bad-bg p-4"
      noValidate
    >
      <p className="mb-3 text-sm font-medium text-ink">Force close this trip</p>

      <div className="mb-3">
        <label htmlFor="reasonCode" className="mb-1.5 block text-xs font-medium text-ink-2">
          Reason
        </label>
        <select
          id="reasonCode"
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        >
          <option value="" disabled>
            Select a reason
          </option>
          {REASON_CODES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="endOdometer" className="mb-1.5 block text-xs font-medium text-ink-2">
          Closing odometer (optional, if known)
        </label>
        <input
          id="endOdometer"
          type="number"
          min={0}
          value={endOdometer}
          onChange={(e) => setEndOdometer(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="reasonNote" className="mb-1.5 block text-xs font-medium text-ink-2">
          Note (optional)
        </label>
        <textarea
          id="reasonNote"
          value={reasonNote}
          onChange={(e) => setReasonNote(e.target.value)}
          disabled={isSubmitting}
          rows={2}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        />
      </div>

      {error && (
        <div role="alert" className="mb-3 rounded-lg bg-paper px-3 py-2 text-sm text-bad">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isSubmitting}
          className="rounded-lg border border-line-2 px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !reasonCode}
          className="rounded-lg bg-bad px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Closing…" : "Confirm force close"}
        </button>
      </div>
    </form>
  );
}
