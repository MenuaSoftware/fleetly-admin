"use client";

import { useState } from "react";
import {
  DamagePhotoSummary,
  getDamagePhotoViewUrlAction,
  listDamagePhotosAction,
} from "@/app/trips/[id]/actions";

/**
 * Collapsed by default, fetches on the first expand — same reasoning
 * as trip-photo-viewer.tsx's own per-photo on-demand fetch, just one
 * level up (the list itself, not only each photo's signed URL).
 */
export function DamagePhotoGallery({ vehicleId, damageId }: { vehicleId: string; damageId: string }) {
  const [state, setState] = useState<
    | { kind: "collapsed" }
    | { kind: "loading" }
    | { kind: "loaded"; photos: DamagePhotoSummary[] }
    | { kind: "error"; message: string }
  >({ kind: "collapsed" });

  async function handleExpand() {
    setState({ kind: "loading" });
    const result = await listDamagePhotosAction(vehicleId, damageId);
    if (result.error || !result.photos) {
      setState({ kind: "error", message: result.error ?? "Could not load photos." });
      return;
    }
    setState({ kind: "loaded", photos: result.photos });
  }

  if (state.kind === "collapsed" || state.kind === "loading") {
    return (
      <button
        type="button"
        onClick={handleExpand}
        disabled={state.kind === "loading"}
        className="text-xs font-medium text-brand hover:text-brand-strong disabled:opacity-60"
      >
        {state.kind === "loading" ? "Loading photos…" : "View photos"}
      </button>
    );
  }

  if (state.kind === "error") {
    return <p className="text-xs text-bad">{state.message}</p>;
  }

  const confirmed = state.photos.filter((p) => p.status === "confirmed");
  if (confirmed.length === 0) {
    return <p className="text-xs text-ink-3">No photos on this report.</p>;
  }

  return (
    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {confirmed.map((photo) => (
        <DamagePhotoTile key={photo.id} vehicleId={vehicleId} damageId={damageId} photoId={photo.id} />
      ))}
    </div>
  );
}

function DamagePhotoTile({ vehicleId, damageId, photoId }: { vehicleId: string; damageId: string; photoId: string }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "loaded"; url: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleView() {
    setState({ kind: "loading" });
    const result = await getDamagePhotoViewUrlAction(vehicleId, damageId, photoId);
    if (result.error || !result.url) {
      setState({ kind: "error", message: result.error ?? "Could not load this photo." });
      return;
    }
    setState({ kind: "loaded", url: result.url });
  }

  if (state.kind === "loaded") {
    return (
      <a href={state.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived remote URL; next/image's domain allowlist doesn't fit a URL that changes per request */}
        <img src={state.url} alt="Damage photo" className="aspect-square w-full object-cover" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleView}
      disabled={state.kind === "loading"}
      className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-line-2 text-xs text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
    >
      {state.kind === "loading" ? "…" : "View"}
      {state.kind === "error" && <span className="text-bad">!</span>}
    </button>
  );
}
