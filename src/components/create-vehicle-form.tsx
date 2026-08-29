"use client";

import { useActionState, useState } from "react";
import { createVehicleAction, CreateVehicleState } from "@/app/vehicles/actions";
import { SubcontractorSummary } from "@/lib/types";

const initialState: CreateVehicleState = { error: null };
const BODY_TYPES = [
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "car", label: "Car" },
] as const;

export function CreateVehicleForm({
  subcontractors,
}: {
  subcontractors: SubcontractorSummary[];
}) {
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialState);
  const [bodyType, setBodyType] = useState<(typeof BODY_TYPES)[number]["value"]>("van");

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(22,22,26,0.06),0_8px_24px_rgba(22,22,26,0.05)]"
      noValidate
    >
      <div className="mb-5">
        <label htmlFor="plate" className="mb-1.5 block text-sm font-medium text-ink-2">
          Plate
        </label>
        <input
          id="plate"
          name="plate"
          type="text"
          required
          disabled={isPending}
          className="w-full rounded-xl border border-line-2 bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash disabled:text-ink-3 font-mono"
          placeholder="1-ABC-123"
        />
      </div>

      <div className="mb-5">
        <span className="mb-1.5 block text-sm font-medium text-ink-2">Body type</span>
        <div className="flex gap-2">
          {BODY_TYPES.map((bt) => (
            <label
              key={bt.value}
              className={`flex-1 cursor-pointer rounded-xl border px-3.5 py-2.5 text-center text-sm font-medium transition-colors ${
                bodyType === bt.value
                  ? "border-brand bg-brand-soft text-brand-strong"
                  : "border-line-2 text-ink-2 hover:bg-wash"
              }`}
            >
              <input
                type="radio"
                name="bodyType"
                value={bt.value}
                checked={bodyType === bt.value}
                onChange={() => setBodyType(bt.value)}
                disabled={isPending}
                className="sr-only"
              />
              {bt.label}
            </label>
          ))}
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
        {isPending ? "Adding…" : "Add vehicle"}
      </button>
    </form>
  );
}
