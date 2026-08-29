import { Camera, CheckCircle2, Clock, Gauge, TriangleAlert, Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { SubcontractorSummary, TripDetail } from "@/lib/types";
import { DamageList } from "@/components/damage-list";
import { ForceCloseTripForm } from "@/components/force-close-trip-form";
import { TripPhotoViewer } from "@/components/trip-photo-viewer";
import { TripShareManager } from "@/components/trip-share-manager";
import { TripAmendmentManager } from "@/components/trip-amendment-manager";
import {
  BackLink,
  EmptyState,
  LiveDot,
  PageShell,
  SectionCard,
  StatusPill,
  type Tone,
} from "@/components/page-kit";

const STATE_LABEL: Record<TripDetail["state"], string> = {
  active: "Active",
  completed: "Completed",
  force_closed: "Force closed",
};

const STATE_TONE: Record<TripDetail["state"], Tone> = {
  active: "ok",
  completed: "neutral",
  force_closed: "warn",
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
    <PageShell width="medium">
      <BackLink href="/trips">Trips</BackLink>

      {/* Masthead — the plate is the identity of a trip, so it leads. */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-paper p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/15">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-mono text-xl font-semibold text-ink">
              {trip.vehiclePlate ?? "Unknown vehicle"}
            </h1>
            <p className="mt-0.5 text-sm text-ink-2">{trip.driverName ?? "Unknown driver"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill tone={STATE_TONE[trip.state]}>
            {trip.state === "active" && <LiveDot tone="ok" />}
            {STATE_LABEL[trip.state]}
          </StatusPill>
          {trip.closureReasonCode && (
            <p className="text-xs text-ink-3">{trip.closureReasonCode.replaceAll("_", " ")}</p>
          )}
        </div>
      </div>

      {/* Odometer strip: start → end → distance reads as one journey. */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-ink-3">
            <Clock className="h-3.5 w-3.5" />
            Started
          </p>
          <p className="text-sm font-medium text-ink">{formatWhen(trip.startedAt)}</p>
          <p className="mt-1 font-mono text-sm text-ink-2">{trip.startOdometer.toLocaleString()} km</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-ink-3">
            <Clock className="h-3.5 w-3.5" />
            Ended
          </p>
          <p className="text-sm font-medium text-ink">{formatWhen(trip.endedAt)}</p>
          <p className="mt-1 font-mono text-sm text-ink-2">
            {trip.endOdometer !== null ? `${trip.endOdometer.toLocaleString()} km` : "—"}
          </p>
        </div>
        {/* Only the *computed* distance earns the brand-filled treatment.
            An open trip has no distance yet, and highlighting an em dash
            reads as an error rather than as "not finished". */}
        <div
          className={
            trip.distance !== null
              ? "col-span-2 rounded-2xl border border-brand/20 bg-brand-soft p-4 shadow-sm sm:col-span-1"
              : "col-span-2 rounded-2xl border border-line bg-paper p-4 shadow-sm sm:col-span-1"
          }
        >
          <p
            className={`mb-1 flex items-center gap-1.5 text-xs ${
              trip.distance !== null ? "text-brand" : "text-ink-3"
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            Distance
          </p>
          {trip.distance !== null ? (
            <p className="font-mono text-2xl leading-none font-semibold text-brand-strong">
              {trip.distance.toLocaleString()}
              <span className="ml-1 text-sm font-medium">km</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-ink-3">
              {trip.state === "active" ? "Trip still open" : "Not recorded"}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <SectionCard
          title="Photographic evidence"
          description={`${trip.photos.length} ${trip.photos.length === 1 ? "photo" : "photos"}`}
          icon={<Camera className="h-4 w-4" />}
          flush={trip.photos.length === 0}
        >
          {trip.photos.length === 0 ? (
            <EmptyState
              icon={<Camera className="h-5 w-5" />}
              title="No photos yet"
              description={
                trip.state === "active"
                  ? "The driver photographs the vehicle when they close the trip."
                  : "Manually reconciled trips carry no photos or confirmations by design."
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trip.photos.map((photo) => (
                <TripPhotoViewer key={photo.id} tripId={trip.id} photo={photo} />
              ))}
            </div>
          )}
        </SectionCard>

        {trip.damage.length > 0 && (
          <SectionCard
            title="Damage"
            description={`${trip.damage.length} recorded`}
            icon={<TriangleAlert className="h-4 w-4" />}
            flush
          >
            <DamageList vehicleId={trip.vehicleId} damage={trip.damage} />
          </SectionCard>
        )}

        <SectionCard title="Confirmations" icon={<CheckCircle2 className="h-4 w-4" />} flush>
          {trip.confirmations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="No confirmations"
              description={
                trip.state === "active"
                  ? "The closing confirmation lands when the driver ends the trip."
                  : "A driver confirms the vehicle’s condition when opening and closing a trip."
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {trip.confirmations.map((c) => (
                <li key={`${c.phase}-${c.serverTime}`} className="flex items-start gap-2.5 px-4 py-3 text-sm">
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
          )}
        </SectionCard>

        {/* TripShareManager and TripAmendmentManager render their own
            section heading and surface, so they are not wrapped in a
            SectionCard here — doing so would nest a card in a card and
            print the heading twice. */}
        <TripShareManager tripId={trip.id} shares={trip.shares} subcontractors={subcontractors} />

        {trip.state !== "active" && <TripAmendmentManager trip={trip} />}

        {trip.state === "active" && <ForceCloseTripForm tripId={trip.id} />}
      </div>
    </PageShell>
  );
}
