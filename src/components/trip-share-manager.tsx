"use client";

import { useState } from "react";
import { grantShareAction, revokeShareAction } from "@/app/trips/[id]/actions";
import { SubcontractorSummary, TripShareSummary } from "@/lib/types";

/**
 * Combines the current-shares list and the "grant a new share" form in
 * one component, deliberately — document-type-list.tsx's own history is
 * why: splitting a list from a sibling create form needs router.refresh()
 * plus a prop-resync fix to avoid staleness. Owning both here instead
 * means a grant can be reflected in local state directly (the
 * subcontractor's name is already in the `subcontractors` prop used for
 * the dropdown, so no refetch is needed to render it), same as
 * damage-list.tsx's self-contained pattern.
 *
 * trip-share.controller.ts is the real authority (trip_dispatcher_writable):
 * only the trip's own subcontractor's dispatcher, or a general admin, can
 * grant or revoke — a recipient dispatcher attempting either gets a 403
 * back from grantShareAction/revokeShareAction as-is, surfaced below.
 */
export function TripShareManager({
  tripId,
  shares: initialShares,
  subcontractors,
}: {
  tripId: string;
  shares: TripShareSummary[];
  subcontractors: SubcontractorSummary[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [subcoId, setSubcoId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [busyShareId, setBusyShareId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeShares = shares.filter((s) => !s.revokedAt);

  async function handleGrant() {
    if (!subcoId) return;
    setIsBusy(true);
    setError(null);
    const result = await grantShareAction(tripId, subcoId);
    setIsBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const subco = subcontractors.find((s) => s.id === subcoId);
    setShares((list) => [
      {
        id: result.id!,
        subcoId,
        subcoName: subco?.name ?? null,
        grantedAt: new Date().toISOString(),
        revokedAt: null,
      },
      ...list,
    ]);
    setSubcoId("");
  }

  async function handleRevoke(share: TripShareSummary) {
    setBusyShareId(share.id);
    setError(null);
    const result = await revokeShareAction(tripId, share.subcoId);
    setBusyShareId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShares((list) =>
      list.map((s) => (s.id === share.id ? { ...s, revokedAt: new Date().toISOString() } : s)),
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-ink">Shared with</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
        {activeShares.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-3">Not shared with any other subcontractor.</p>
        ) : (
          <ul>
            {activeShares.map((s, i) => (
              <li
                key={s.id}
                data-testid={`trip-share-${s.id}`}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{s.subcoName ?? "Unknown subcontractor"}</p>
                  <p className="text-xs text-ink-3">since {new Date(s.grantedAt).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(s)}
                  disabled={busyShareId === s.id}
                  className="shrink-0 inline-flex min-h-8 items-center rounded-lg border border-bad/30 px-2.5 py-1.5 text-xs font-medium text-bad transition-colors hover:bg-bad-bg disabled:opacity-60"
                >
                  {busyShareId === s.id ? "…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <select
            id="grantTargetSubcoId"
            value={subcoId}
            onChange={(e) => setSubcoId(e.target.value)}
            disabled={isBusy}
            className="flex-1 rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
          >
            <option value="">Share with a subcontractor…</option>
            {subcontractors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGrant}
            disabled={isBusy || !subcoId}
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {isBusy ? "Sharing…" : "Share"}
          </button>
        </div>
        {error && (
          <p role="alert" className="border-t border-line px-4 py-2 text-sm text-bad">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
