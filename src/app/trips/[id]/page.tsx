import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, TripDetail } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { ForceCloseTripForm } from "@/components/force-close-trip-form";
import { TripPhotoViewer } from "@/components/trip-photo-viewer";

const STATE_LABEL: Record<TripDetail["state"], string> = {
  active: "Active",
  completed: "Completed",
  force_closed: "Force closed",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const trip = await apiFetch<TripDetail>(`/trips/${id}`);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Link href="/trips" className="mb-4 inline-block text-sm text-ink-2 hover:text-ink">
          ← Trips
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-mono text-lg font-semibold text-ink">{trip.vehiclePlate ?? "Unknown vehicle"}</h1>
            <p className="text-sm text-ink-3">{trip.driverName ?? "Unknown driver"}</p>
          </div>
          <div className="text-right">
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-xs ${
                trip.state === "force_closed" ? "bg-warn-bg text-warn" : "bg-wash text-ink-2"
              }`}
            >
              {STATE_LABEL[trip.state]}
            </span>
            {trip.closureReasonCode && (
              <p className="mt-1 text-xs text-ink-3">{trip.closureReasonCode.replaceAll("_", " ")}</p>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs text-ink-3">Started</p>
            <p className="text-sm font-medium text-ink">{formatWhen(trip.startedAt)}</p>
            <p className="mt-1 font-mono text-sm text-ink-2">{trip.startOdometer} km</p>
          </div>
          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs text-ink-3">Ended</p>
            <p className="text-sm font-medium text-ink">{formatWhen(trip.endedAt)}</p>
            <p className="mt-1 font-mono text-sm text-ink-2">
              {trip.endOdometer !== null ? `${trip.endOdometer} km` : "—"}
            </p>
          </div>
        </div>

        {trip.distance !== null && (
          <div className="mb-6 rounded-2xl border border-line bg-paper p-4 text-center">
            <p className="text-xs text-ink-3">Distance</p>
            <p className="font-mono text-2xl font-semibold text-ink">{trip.distance} km</p>
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold text-ink">Photographic evidence</h2>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {trip.photos.length === 0 ? (
            <p className="col-span-full text-sm text-ink-3">No photos on this trip.</p>
          ) : (
            trip.photos.map((photo) => <TripPhotoViewer key={photo.id} tripId={trip.id} photo={photo} />)
          )}
        </div>

        {trip.damage.length > 0 && (
          <>
            <h2 className="mb-2 text-sm font-semibold text-ink">Damage</h2>
            <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
              <ul>
                {trip.damage.map((d, i) => (
                  <li
                    key={d.id}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="text-ink">{d.view}</span>
                    <span className="text-ink-3">
                      {d.status}
                      {d.reportedPhase ? ` · ${d.reportedPhase}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <h2 className="mb-2 text-sm font-semibold text-ink">Confirmations</h2>
        <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
          <ul>
            {trip.confirmations.map((c, i) => (
              <li
                key={`${c.phase}-${c.serverTime}`}
                className={`px-4 py-3 text-sm ${i > 0 ? "border-t border-line" : ""}`}
              >
                <p className="font-medium text-ink capitalize">{c.phase}</p>
                <p className="text-xs text-ink-3">
                  {formatWhen(c.serverTime)}
                  {c.acknowledgedDamageIds.length > 0
                    ? ` · ${c.acknowledgedDamageIds.length} damage item${c.acknowledgedDamageIds.length === 1 ? "" : "s"} acknowledged`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {trip.state === "active" && <ForceCloseTripForm tripId={trip.id} />}
      </div>
    </main>
  );
}
