"use client";

import { useState } from "react";
import { issueBadgeAction } from "@/app/drivers/actions";
import { QrCodePanel } from "@/components/qr-code-panel";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "issued"; token: string; qrSvg: string }
  | { kind: "error"; message: string };

export function IssueBadgeButton({ driverId }: { driverId: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleIssue() {
    setState({ kind: "loading" });
    const result = await issueBadgeAction(driverId);
    if (result.error || !result.token || !result.qrSvg) {
      setState({ kind: "error", message: result.error ?? "Could not issue a badge." });
      return;
    }
    setState({ kind: "issued", token: result.token, qrSvg: result.qrSvg });
  }

  if (state.kind === "issued") {
    return (
      <div className="rounded-xl border border-line bg-paper">
        {/*
          Shown exactly once — this is the only moment the raw token
          exists outside the physical badge (the API stores only its
          hash). Printing it now is the whole point of issuing it.
        */}
        <QrCodePanel
          svg={state.qrSvg}
          title="Fleetly badge"
          caption="Print this on the badge. The driver scans it to set up their phone — it is not shown again."
          payload={state.token}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleIssue}
        disabled={state.kind === "loading"}
        className="inline-flex min-h-8 items-center rounded-lg border border-line-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
      >
        {state.kind === "loading" ? "Issuing…" : "Issue badge"}
      </button>
      {state.kind === "error" && <span className="text-xs text-bad">{state.message}</span>}
    </div>
  );
}
