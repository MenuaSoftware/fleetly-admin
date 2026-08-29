import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { SubcontractorSummary, TripDetail } from "@/lib/types";
import { DamageList } from "@/components/damage-list";
import { ForceCloseTripForm } from "@/components/force-close-trip-form";
import { TripPhotoViewer } from "@/components/trip-photo-viewer";
import { TripShareManager } from "@/components/trip-share-manager";
import { TripAmendmentManager } from "@/components/trip-amendment-manager";

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

  const trip = await apiFetch<TripDetail>(`/trips/${id}`);
  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors").catch(() => []);

  return (
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/trips"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Trips
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-ink">{trip.vehiclePlate ?? "Unknown vehicle"}</h1>
          <p className="text-sm text-ink-3">{trip.driverName ?? "Unknown driver"}</p>
        </div>
        <div className="text-right">
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-xs ${
              trip.state === "force_closed" ? "bg-warn-bg text-warn" : trip.state === "active" ? "bg-ok-bg text-ok" : "bg-wash text-ink-2"
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
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
          <p className="text-xs text-ink-3">Started</p>
          <p className="text-sm font-medium text-ink">{formatWhen(trip.startedAt)}</p>
          <p className="mt-1 font-mono text-sm text-ink-2">{trip.startOdometer} km</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
          <p className="text-xs text-ink-3">Ended</p>
          <p className="text-sm font-medium text-ink">{formatWhen(trip.endedAt)}</p>
          <p className="mt-1 font-mono text-sm text-ink-2">
            {trip.endOdometer !== null ? `${trip.endOdometer} km` : "—"}
          </p>
        </div>
      </div>

      {trip.distance !== null && (
        <div className="mb-6 rounded-2xl border border-line bg-paper p-4 text-center shadow-sm">
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
          <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
            <DamageList vehicleId={trip.vehicleId} damage={trip.damage} />
          </div>
        </>
      )}

      <h2 className="mb-2 text-sm font-semibold text-ink">Confirmations</h2>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        <ul>
          {trip.confirmations.map((c, i) => (
            <li
              key={`${c.phase}-${c.serverTime}`}
              className={`flex items-start gap-2.5 px-4 py-3 text-sm ${i > 0 ? "border-t border-line" : ""}`}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" strokeWidth={2} />
              <div>
                <p className="font-medium text-ink capitalize">{c.phase}</p>
                <p className="text-xs text-ink-3">
                  {formatWhen(c.serverTime)}
                  {c.acknowledgedDamageIds.length > 0
                    ? ` · ${c.acknowledgedDamageIds.length} damage item${c.acknowledgedDamageIds.length === 1 ? "" : "s"} acknowledged`
                    : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <TripShareManager tripId={trip.id} shares={trip.shares} subcontractors={subcontractors} />

      {trip.state !== "active" && <TripAmendmentManager trip={trip} />}

      {trip.state === "active" && <ForceCloseTripForm tripId={trip.id} />}
    </div>
  );
}
