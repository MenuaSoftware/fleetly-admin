import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { IncidentSummary } from "@/lib/types";
import { IncidentPhotoGallery } from "@/components/incident-photo-gallery";

const TYPE_LABEL: Record<IncidentSummary["type"], string> = {
  breakdown: "Breakdown",
  new_damage: "New damage",
};

const TYPE_BADGE_CLASS: Record<IncidentSummary["type"], string> = {
  breakdown: "bg-bad-bg text-bad",
  new_damage: "bg-warn-bg text-warn",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * incident.controller.ts's own comment: "No separate lifecycle, no
 * workflow, no states" — report and list are the entire surface, so
 * this is deliberately just a read-only feed, not a management screen
 * like /trips/[id]'s damage list. Any real follow-up (registering
 * formal damage, force-closing a trip) happens through those existing,
 * separate screens, exactly as the backend's own doc describes.
 */
export default async function IncidentsPage() {
  const incidents = await apiFetch<IncidentSummary[]>("/incidents");

  return (
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Incidents</h1>
        <p className="text-sm text-ink-3">Breakdowns and new damage reported by drivers.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <TriangleAlert className="h-8 w-8 text-ink-3" strokeWidth={1.5} />
            <p className="text-sm text-ink-3">No incidents reported.</p>
          </div>
        ) : (
          <ul>
            {incidents.map((inc, i) => (
              <li key={inc.id} className={`px-5 py-3.5 transition-colors hover:bg-wash ${i > 0 ? "border-t border-line" : ""}`}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">
                    {inc.driverName ?? "Unknown driver"}
                    <span className="text-ink-3"> · </span>
                    <span className="font-mono">{inc.vehiclePlate ?? "—"}</span>
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs ${TYPE_BADGE_CLASS[inc.type]}`}>
                    {TYPE_LABEL[inc.type]}
                  </span>
                </div>
                <p className="text-sm text-ink-2">{inc.note}</p>
                <p className="mt-1 text-xs text-ink-3">
                  {formatWhen(inc.capturedAt)}
                  {inc.tripId && (
                    <>
                      {" · "}
                      <Link href={`/trips/${inc.tripId}`} className="text-accent hover:text-accent-strong">
                        view trip
                      </Link>
                    </>
                  )}
                </p>
                <div className="mt-1.5">
                  <IncidentPhotoGallery incidentId={inc.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
