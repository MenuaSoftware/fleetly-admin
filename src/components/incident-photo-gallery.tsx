"use client";

import { useState } from "react";
import {
  IncidentPhotoSummary,
  getIncidentPhotoViewUrlAction,
  listIncidentPhotosAction,
} from "@/app/incidents/actions";

/**
 * Same collapsed-until-expanded, on-demand pattern as
 * damage-photo-gallery.tsx — a fresh signed URL isn't worth minting
 * before anyone asks to see it.
 */
export function IncidentPhotoGallery({ incidentId }: { incidentId: string }) {
  const [state, setState] = useState<
    | { kind: "collapsed" }
    | { kind: "loading" }
    | { kind: "loaded"; photos: IncidentPhotoSummary[] }
    | { kind: "error"; message: string }
  >({ kind: "collapsed" });

  async function handleExpand() {
    setState({ kind: "loading" });
    const result = await listIncidentPhotosAction(incidentId);
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
        <IncidentPhotoTile key={photo.id} incidentId={incidentId} photoId={photo.id} />
      ))}
    </div>
  );
}

function IncidentPhotoTile({ incidentId, photoId }: { incidentId: string; photoId: string }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "loaded"; url: string } | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function handleView() {
    setState({ kind: "loading" });
    const result = await getIncidentPhotoViewUrlAction(incidentId, photoId);
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
        <img src={state.url} alt="Incident photo" className="aspect-square w-full object-cover" />
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
