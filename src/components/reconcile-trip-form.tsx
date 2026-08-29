"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { reconcileTripAction } from "@/app/trips/reconcile/actions";
import { DriverSummary, VehicleSummary } from "@/lib/types";

/**
 * Plain async handler, not useActionState/useTransition — see
 * vehicle-status-toggle.tsx's own history for why that pattern is
 * avoided here. Redirects to the new trip's detail page on success,
 * same as invite-form.tsx's own reasoning (a genuinely different page
 * to land on, not "stay and do another" like create-document-type-form.tsx).
 */
export function ReconcileTripForm({ drivers, vehicles }: { drivers: DriverSummary[]; vehicles: VehicleSummary[] }) {
  const router = useRouter();
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    driverId && vehicleId && startOdometer.trim() && endOdometer.trim() && startedAt && endedAt && reasonNote.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    const result = await reconcileTripAction({
      driverId,
      vehicleId,
      startOdometer: Number(startOdometer),
      endOdometer: Number(endOdometer),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      reasonNote: reasonNote.trim(),
    });
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/trips/${result.id!}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-paper p-6" noValidate>
      <div className="mb-4">
        <label htmlFor="reconcileDriverId" className="mb-1.5 block text-xs font-medium text-ink-2">
          Driver
        </label>
        <select
          id="reconcileDriverId"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        >
          <option value="">Select a driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.firstName} {d.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="reconcileVehicleId" className="mb-1.5 block text-xs font-medium text-ink-2">
          Vehicle
        </label>
        <select
          id="reconcileVehicleId"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        >
          <option value="">Select a vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reconcileStartOdometer" className="mb-1.5 block text-xs font-medium text-ink-2">
            Start odometer (km)
          </label>
          <input
            id="reconcileStartOdometer"
            type="number"
            min={0}
            value={startOdometer}
            onChange={(e) => setStartOdometer(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
          />
        </div>
        <div>
          <label htmlFor="reconcileEndOdometer" className="mb-1.5 block text-xs font-medium text-ink-2">
            End odometer (km)
          </label>
          <input
            id="reconcileEndOdometer"
            type="number"
            min={0}
            value={endOdometer}
            onChange={(e) => setEndOdometer(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="reconcileStartedAt" className="mb-1.5 block text-xs font-medium text-ink-2">
            Started at
          </label>
          <input
            id="reconcileStartedAt"
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
          />
        </div>
        <div>
          <label htmlFor="reconcileEndedAt" className="mb-1.5 block text-xs font-medium text-ink-2">
            Ended at
          </label>
          <input
            id="reconcileEndedAt"
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="reconcileReasonNote" className="mb-1.5 block text-xs font-medium text-ink-2">
          Reason (from the paper log)
        </label>
        <textarea
          id="reconcileReasonNote"
          value={reasonNote}
          onChange={(e) => setReasonNote(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          placeholder="e.g. App outage the morning of 24 Aug — recorded on paper at the depot."
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        />
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-bad/20 bg-bad-bg px-3 py-2 text-sm text-bad">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {isSubmitting ? "Reconciling…" : "Reconcile trip"}
      </button>
    </form>
  );
}
