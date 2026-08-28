import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, IncidentSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const incidents = await apiFetch<IncidentSummary[]>("/incidents");

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Incidents</h1>
          <p className="text-sm text-ink-3">Breakdowns and new damage reported by drivers.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {incidents.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-3">No incidents reported.</p>
          ) : (
            <ul>
              {incidents.map((inc, i) => (
                <li key={inc.id} className={`px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
