"use client";

import { useState } from "react";
import { issueBadgeAction } from "@/app/drivers/actions";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "issued"; token: string }
  | { kind: "error"; message: string };

export function IssueBadgeButton({ driverId }: { driverId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleIssue() {
    setState({ kind: "loading" });
    const result = await issueBadgeAction(driverId);
    if (result.error || !result.token) {
      setState({ kind: "error", message: result.error ?? "Could not issue a badge." });
      return;
    }
    setState({ kind: "issued", token: result.token });
  }

  if (state.kind === "issued") {
    return (
      <div className="flex items-center gap-2">
        <code className="rounded-lg bg-wash px-2 py-1 font-mono text-xs text-ink">
          {state.token}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(state.token)}
          className="text-xs font-medium text-accent hover:text-accent-strong"
        >
          Copy
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleIssue}
        disabled={state.kind === "loading"}
        className="rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
      >
        {state.kind === "loading" ? "Issuing…" : "Issue badge"}
      </button>
      {state.kind === "error" && <span className="text-xs text-bad">{state.message}</span>}
    </div>
  );
}
