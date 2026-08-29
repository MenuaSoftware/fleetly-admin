"use client";

import { useState } from "react";
import { amendTripAction } from "@/app/trips/[id]/actions";
import { TripAmendmentSummary, TripDetail } from "@/lib/types";

const FIELD_LABEL: Record<TripAmendmentSummary["field"], string> = {
  start_odometer: "Start odometer",
  end_odometer: "End odometer",
  closure_reason_note: "Closure reason",
};

/**
 * trip-amendment.controller.ts: "A closed trip is immutable in state,
 * not in content" — only shown for a completed/force_closed trip
 * (active trips can't be amended; the backend itself rejects it).
 * closure_reason_note is only ever offered when the trip is actually
 * force_closed — the backend rejects it otherwise too ("This trip has
 * no closure reason to amend"), this just avoids offering a field that
 * would predictably 400.
 *
 * One component owning both the history list and the amend form, same
 * reasoning as trip-share-manager.tsx: a fresh amendment's field/value/
 * reason are already known locally from the form's own inputs, no
 * refetch needed to render it.
 */
export function TripAmendmentManager({ trip }: { trip: TripDetail }) {
  const [amendments, setAmendments] = useState(trip.amendments);
  const [field, setField] = useState<TripAmendmentSummary["field"]>("end_odometer");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFields: TripAmendmentSummary["field"][] =
    trip.state === "force_closed"
      ? ["start_odometer", "end_odometer", "closure_reason_note"]
      : ["start_odometer", "end_odometer"];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim() || !reason.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const result = await amendTripAction(trip.id, field, value.trim(), reason.trim());
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAmendments((list) => [
      ...list,
      {
        id: result.amendment!.id,
        field: result.amendment!.field as TripAmendmentSummary["field"],
        oldValue: result.amendment!.oldValue,
        newValue: result.amendment!.newValue,
        reason: reason.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setValue("");
    setReason("");
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-ink">Amendments</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
        {amendments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-3">No corrections made.</p>
        ) : (
          <ul>
            {amendments.map((a, i) => (
              <li key={a.id} className={`px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}>
                <p className="text-sm font-medium text-ink">
                  {FIELD_LABEL[a.field]}: {a.oldValue ?? "—"} → {a.newValue}
                </p>
                <p className="text-xs text-ink-3">
                  {a.reason} · {new Date(a.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-line p-4" noValidate>
          <div className="flex flex-wrap gap-2">
            <select
              id="amendField"
              value={field}
              onChange={(e) => setField(e.target.value as TripAmendmentSummary["field"])}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
            >
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABEL[f]}
                </option>
              ))}
            </select>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isSubmitting}
              placeholder={field === "closure_reason_note" ? "New closure reason" : "New reading (km)"}
              type={field === "closure_reason_note" ? "text" : "number"}
              className="flex-1 rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
            />
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            placeholder="Why is this being corrected?"
            className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
          />
          {error && (
            <p role="alert" className="text-sm text-bad">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !value.trim() || !reason.trim()}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Amend"}
          </button>
        </form>
      </div>
    </div>
  );
}
