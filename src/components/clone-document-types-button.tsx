"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cloneDefaultsAction } from "@/app/document-types/actions";
import { SubcontractorSummary } from "@/lib/types";

/**
 * document-type.controller.ts's cloneDefaults(): copies every global
 * default (subco_id null) into new, independent rows owned by the
 * target subcontractor — a one-time copy, not a live link. Refreshing
 * via router.refresh() rather than owning local list state here, since
 * the clone can add an unknown number of new rows the parent's own
 * fetched list needs to pick up.
 */
export function CloneDocumentTypesButton({ subcontractors }: { subcontractors: SubcontractorSummary[] }) {
  const router = useRouter();
  const [subcoId, setSubcoId] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClone() {
    if (!subcoId) return;
    setIsCloning(true);
    setError(null);
    const result = await cloneDefaultsAction(subcoId);
    setIsCloning(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="mb-2 text-sm font-semibold text-ink">Clone defaults to a subcontractor</p>
      <div className="flex flex-wrap gap-2">
        <select
          id="cloneTargetSubcoId"
          value={subcoId}
          onChange={(e) => setSubcoId(e.target.value)}
          disabled={isCloning}
          className="flex-1 rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
        >
          <option value="">Select a subcontractor</option>
          {subcontractors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleClone}
          disabled={isCloning || !subcoId}
          className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {isCloning ? "Cloning…" : "Clone"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
