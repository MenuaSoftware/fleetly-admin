import { TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { IncidentSummary } from "@/lib/types";
import { EmptyState, PageHeader, PageShell } from "@/components/page-kit";
import { IncidentTimeline } from "@/components/incident-timeline";

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

  const breakdowns = incidents.filter((i) => i.type === "breakdown").length;
  const damage = incidents.length - breakdowns;

  return (
    <PageShell width="medium">
      <PageHeader
        eyebrow="Reports"
        title="Incidents"
        description="Breakdowns and new damage reported by drivers."
        icon={<TriangleAlert className="h-5 w-5" />}
      />

      {incidents.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            <span className="font-mono text-ink">{breakdowns}</span> breakdowns
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-bad" />
            <span className="font-mono text-ink">{damage}</span> new damage
          </span>
        </div>
      )}

      {incidents.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<TriangleAlert className="h-5 w-5" />}
            title="No incidents reported"
            description="Drivers report breakdowns and new damage from the mobile app. Anything they send appears here."
          />
        </div>
      ) : (
        <IncidentTimeline incidents={incidents} />
      )}
    </PageShell>
  );
}
