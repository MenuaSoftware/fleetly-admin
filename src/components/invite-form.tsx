"use client";

import { useActionState, useState } from "react";
import { inviteStaffAction, InviteState } from "@/app/staff/invite/actions";

interface SubcontractorSummary {
  id: string;
  name: string;
}

const initialState: InviteState = { error: null };

export function InviteForm({ subcontractors }: { subcontractors: SubcontractorSummary[] }) {
  const [state, formAction, isPending] = useActionState(inviteStaffAction, initialState);
  const [role, setRole] = useState<"dispatcher" | "general_admin">("dispatcher");

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
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
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
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
          />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
          placeholder="dispatcher@subcontractor.com"
        />
      </div>

      <div className="mb-5">
        <span className="mb-1.5 block text-sm font-medium text-ink-2">Role</span>
        <div className="flex gap-2">
          {(["dispatcher", "general_admin"] as const).map((r) => (
            <label
              key={r}
              className={`flex-1 cursor-pointer rounded-xl border px-3.5 py-2.5 text-center text-sm font-medium transition-colors ${
                role === r
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line-2 text-ink-2 hover:bg-wash"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                disabled={isPending}
                className="sr-only"
              />
              {r === "dispatcher" ? "Dispatcher" : "General admin"}
            </label>
          ))}
        </div>
      </div>

      {role === "dispatcher" && (
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
            className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash disabled:text-ink-3"
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
      {role === "general_admin" && <div className="mb-6" />}

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
        className="flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending invite…" : "Send invite"}
      </button>
    </form>
  );
}
