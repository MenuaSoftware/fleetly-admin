"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { createDocumentTypeAction, DocumentTypeActionState } from "@/app/document-types/actions";
import { SubcontractorSummary } from "@/lib/types";

const initialState: DocumentTypeActionState = { error: null };

/**
 * Unlike invite-form.tsx (which redirects to a different page on
 * success, forcing a real fresh render), this form deliberately stays
 * on the same page so the admin can add several types in a row.
 * revalidatePath() in the Server Action only marks the route's cache
 * stale for the *next* navigation — it does not, by itself, refresh an
 * already-mounted page (confirmed live: the new type existed for real
 * server-side, but DocumentTypeList's props never updated). router.
 * refresh() is what actually re-fetches this page's server data;
 * isPending's true->false edge with no error is the signal a
 * submission just succeeded, since state.error is identically null in
 * both the untouched-initial and just-succeeded cases.
 */
export function CreateDocumentTypeForm({ subcontractors }: { subcontractors: SubcontractorSummary[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createDocumentTypeAction, initialState);
  const [attachedTo, setAttachedTo] = useState<"vehicle" | "driver">("vehicle");
  const [scope, setScope] = useState<"global" | string>("global");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      router.refresh();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, router]);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-paper p-6"
      noValidate
    >
      <p className="mb-4 text-sm font-semibold text-ink">New document type</p>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-2">Attached to</span>
        <div className="flex gap-2">
          {(["vehicle", "driver"] as const).map((v) => (
            <label
              key={v}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium capitalize transition-colors ${
                attachedTo === v ? "border-accent bg-accent-soft text-accent-strong" : "border-line-2 text-ink-2 hover:bg-wash"
              }`}
            >
              <input
                type="radio"
                name="attachedTo"
                value={v}
                checked={attachedTo === v}
                onChange={() => setAttachedTo(v)}
                disabled={isPending}
                className="sr-only"
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink-2">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          disabled={isPending}
          placeholder="e.g. Insurance certificate"
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="alertWindowDays" className="mb-1.5 block text-xs font-medium text-ink-2">
          Alert this many days before expiry
        </label>
        <input
          id="alertWindowDays"
          name="alertWindowDays"
          type="number"
          min={1}
          required
          disabled={isPending}
          defaultValue={30}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="subcoId" className="mb-1.5 block text-xs font-medium text-ink-2">
          Scope
        </label>
        <select
          id="subcoId"
          name="subcoId"
          value={scope === "global" ? "" : scope}
          onChange={(e) => setScope(e.target.value || "global")}
          disabled={isPending}
          className="w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
        >
          <option value="">Global default</option>
          {subcontractors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} only
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <div role="alert" className="mb-4 rounded-lg border border-bad/20 bg-bad-bg px-3 py-2 text-sm text-bad">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add document type"}
      </button>
    </form>
  );
}
