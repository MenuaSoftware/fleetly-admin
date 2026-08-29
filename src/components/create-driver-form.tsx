"use client";

import { useActionState } from "react";
import { createDriverAction, CreateDriverState } from "@/app/drivers/actions";
import { SubcontractorSummary } from "@/lib/types";

const initialState: CreateDriverState = { error: null };

/**
 * No role toggle like InviteForm — a driver has no role concept.
 * subcontractors is empty for a dispatcher, who never sees a picker at
 * all: driver.controller.ts silently uses their own subco regardless of
 * what's submitted, so showing a field they can't actually control
 * would be misleading, not just redundant.
 */
export function CreateDriverForm({
  subcontractors,
}: {
  subcontractors: SubcontractorSummary[];
}) {
  const [state, formAction, isPending] = useActionState(createDriverAction, initialState);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(22,22,26,0.06),0_8px_24px_rgba(22,22,26,0.05)]"
      noValidate
    >
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-ink-2">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            disabled={isPending}
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-ink-2">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            disabled={isPending}
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3"
          />
        </div>
      </div>

      {subcontractors.length > 0 && (
        <div className="mb-6">
          <label htmlFor="subcoId" className="mb-1.5 block text-sm font-medium text-ink-2">
            Subcontractor
          </label>
          <select
            id="subcoId"
            name="subcoId"
            required
            disabled={isPending}
            defaultValue=""
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3"
          >
            <option value="" disabled>
              Select a subcontractor
            </option>
            {subcontractors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {subcontractors.length === 0 && <div className="mb-6" />}

      {state.error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-bad/20 bg-bad-bg px-3.5 py-2.5 text-sm text-bad"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add driver"}
      </button>
    </form>
  );
}
