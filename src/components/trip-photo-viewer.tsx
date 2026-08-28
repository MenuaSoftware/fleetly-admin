"use client";

import { useState } from "react";
import { getPhotoViewUrlAction } from "@/app/trips/[id]/actions";
import { TripPhotoSummary } from "@/lib/types";

const PHOTO_TYPE_LABEL: Record<TripPhotoSummary["photoType"], string> = {
  front: "Front",
  left: "Left side",
  right: "Right side",
  rear: "Rear",
};

/**
 * Fetches the signed URL on demand (a click), not upfront for every
 * photo on page load — each one is a fresh, short-lived (5 min) link
 * from GET .../view-url, no reason to mint four of them before anyone
 * has asked to see one.
 */
export function TripPhotoViewer({ tripId, photo }: { tripId: string; photo: TripPhotoSummary }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "loaded"; url: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleView() {
    setState({ kind: "loading" });
    const result = await getPhotoViewUrlAction(tripId, photo.id);
    if (result.error || !result.url) {
      setState({ kind: "error", message: result.error ?? "Could not load this photo." });
      return;
    }
    setState({ kind: "loaded", url: result.url });
  }

  if (photo.status !== "confirmed") {
    return (
      <div className="rounded-xl border border-line-2 px-3.5 py-2.5 text-center text-sm text-ink-3">
        {PHOTO_TYPE_LABEL[photo.photoType]}
        <span className="block text-xs">not uploaded</span>
      </div>
    );
  }

  if (state.kind === "loaded") {
    return (
      <a href={state.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived remote URL; next/image's domain allowlist doesn't fit a URL that changes per request */}
        <img src={state.url} alt={PHOTO_TYPE_LABEL[photo.photoType]} className="aspect-square w-full object-cover" />
        <p className="px-2 py-1.5 text-center text-xs text-ink-2">{PHOTO_TYPE_LABEL[photo.photoType]}</p>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleView}
      disabled={state.kind === "loading"}
      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-line-2 text-sm text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
    >
      <span>{state.kind === "loading" ? "Loading…" : `View ${PHOTO_TYPE_LABEL[photo.photoType]}`}</span>
      {state.kind === "error" && <span className="text-xs text-bad">{state.message}</span>}
    </button>
  );
}
