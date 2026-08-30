"use client";

import { useState } from "react";
import { runRetentionEnforcementAction, setRetentionPolicyAction } from "@/app/retention/actions";
import { RetentionEnforcementResult, RetentionPolicySummary } from "@/lib/types";

// Mirrors retention.controller.ts's ENFORCEABLE_TYPES map exactly — the
// backend is what actually enforces this set (PUT /retention/:dataType
// 404s on anything else), this is just what's offered in the UI. Labels
// match docs/product-brief.md's own framing (§ "Location is nonetheless
// personal data... a separate retention period from photo retention").
const KNOWN_TYPES = [
  { dataType: "trip_photo", label: "Trip photos" },
  { dataType: "damage_photo", label: "Damage photos" },
  { dataType: "location_point", label: "Location data (trip confirmations & damage reports)" },
] as const;

/**
 * One component owning both the policy list and its own edit state, same
 * reasoning as trip-share-manager.tsx: KNOWN_TYPES is fixed and known
 * upfront (not discovered from the server), so there's no sibling-form
 * staleness risk to design around here at all — every row always exists,
 * "not yet configured" is just an empty state for that row.
 */
export function RetentionPolicyManager({ policies: initial }: { policies: RetentionPolicySummary[] }) {
  const [policies, setPolicies] = useState(initial);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editDays, setEditDays] = useState("");
  const [busyType, setBusyType] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEnforcing, setIsEnforcing] = useState(false);
  const [enforceResults, setEnforceResults] = useState<RetentionEnforcementResult[] | null>(null);
  const [enforceError, setEnforceError] = useState<string | null>(null);

  function policyFor(dataType: string) {
    return policies.find((p) => p.dataType === dataType) ?? null;
  }

  function startEdit(dataType: string) {
    setEditingType(dataType);
    setEditDays(String(policyFor(dataType)?.retentionDays ?? 90));
    setErrors((e) => ({ ...e, [dataType]: "" }));
  }

  async function handleSave(dataType: string) {
    const retentionDays = Number(editDays);
    if (!Number.isFinite(retentionDays) || retentionDays < 1) return;
    setBusyType(dataType);
    const result = await setRetentionPolicyAction(dataType, retentionDays);
    setBusyType(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [dataType]: result.error! }));
      return;
    }
    setPolicies((list) => {
      const rest = list.filter((p) => p.dataType !== dataType);
      return [...rest, result.policy!];
    });
    setEditingType(null);
  }

  async function handleEnforce() {
    setIsEnforcing(true);
    setEnforceError(null);
    setEnforceResults(null);
    const result = await runRetentionEnforcementAction();
    setIsEnforcing(false);
    if (result.error) {
      setEnforceError(result.error);
      return;
    }
    setEnforceResults(result.results ?? []);
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
        <ul>
          {KNOWN_TYPES.map(({ dataType, label }, i) => {
            const policy = policyFor(dataType);
            return (
              <li
                key={dataType}
                data-testid={`retention-policy-${dataType}`}
                className={`px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                {editingType === dataType ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-[10rem] flex-1 text-sm font-medium text-ink">{label}</span>
                    <input
                      type="number"
                      min={1}
                      value={editDays}
                      onChange={(e) => setEditDays(e.target.value)}
                      disabled={busyType === dataType}
                      className="w-20 rounded-lg border border-line-2 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none disabled:bg-wash"
                    />
                    <span className="text-xs text-ink-3">days</span>
                    <button
                      type="button"
                      onClick={() => handleSave(dataType)}
                      disabled={busyType === dataType}
                      className="inline-flex min-h-8 items-center rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      disabled={busyType === dataType}
                      className="inline-flex min-h-8 items-center rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-wash disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <p className="text-xs text-ink-3">
                        {policy ? `kept for ${policy.retentionDays} days` : "not yet configured"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(dataType)}
                      className="shrink-0 inline-flex min-h-8 items-center rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash"
                    >
                      {policy ? "Edit" : "Configure"}
                    </button>
                  </div>
                )}
                {errors[dataType] && (
                  <p role="alert" className="mt-1.5 text-xs text-bad">
                    {errors[dataType]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4">
        <p className="mb-1 text-sm font-semibold text-ink">Run enforcement now</p>
        <p className="mb-3 text-xs text-ink-3">
          No schedule is wired up yet — this runs one real pass immediately, deleting expired photos and
          clearing expired location data. Safe to run repeatedly.
        </p>
        <button
          type="button"
          onClick={handleEnforce}
          disabled={isEnforcing}
          className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {isEnforcing ? "Running…" : "Run enforcement"}
        </button>
        {enforceError && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {enforceError}
          </p>
        )}
        {enforceResults && (
          <ul className="mt-3 space-y-1">
            {enforceResults.map((r) => (
              <li key={r.dataType} className="font-mono text-xs text-ink-2">
                {r.dataType}: {r.affected} affected
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
