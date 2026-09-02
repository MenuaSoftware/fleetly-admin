import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Gauge, QrCode, Route as RouteIcon, TriangleAlert } from "lucide-react";
import { apiFetch, ApiError, getMe } from "@/lib/api";
import { renderQrSvg, vehicleQrPayload } from "@/lib/qr-payload";
import { QrCodePanel } from "@/components/qr-code-panel";
import type {
  DamageSummary,
  DocumentSummary,
  IncidentSummary,
  SubcontractorSummary,
  TripSummary,
  VehicleSummary,
} from "@/lib/types";
import { BackLink, EmptyState, PageShell, SectionCard, StatusPill } from "@/components/page-kit";
import { VehicleAvatar } from "@/components/entity-grid";
import {
  DetailDocumentList,
  DetailMasthead,
  DetailStats,
  DetailTripList,
} from "@/components/detail-kit";
import { IncidentTimeline } from "@/components/incident-timeline";
import { DamageList } from "@/components/damage-list";
import { VehicleStatusToggle } from "@/components/vehicle-status-toggle";

const BODY_TYPE_LABEL: Record<VehicleSummary["bodyType"], string> = {
  van: "Van",
  truck: "Truck",
  car: "Car",
};

/**
 * One vehicle, everything about it. The damage register leads, because
 * that is what this product is for: docs/product-brief.md calls the
 * whole thing a "fleet check-in and damage register", and until now the
 * standing register for a vehicle could only be seen a slice at a time
 * through whichever trip happened to touch it.
 *
 * Reuses DamageList (the same accept/dismiss/repair state machine the
 * trip screen drives) — DamageSummary is a superset of the
 * TripDamageSummary it takes, so the actions work identically here.
 */
export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const vehicle = await apiFetch<VehicleSummary>(`/vehicles/${id}`).catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
  if (!vehicle) notFound();

  const [trips, documents, damage, incidents, subcontractors] = await Promise.all([
    apiFetch<TripSummary[]>(`/trips?vehicleId=${encodeURIComponent(id)}`).catch(() => []),
    apiFetch<DocumentSummary[]>(`/documents?vehicleId=${encodeURIComponent(id)}`).catch(() => []),
    apiFetch<DamageSummary[]>(`/vehicles/${encodeURIComponent(id)}/damage`).catch(() => []),
    apiFetch<IncidentSummary[]>("/incidents").catch(() => []),
    isGeneralAdmin
      ? apiFetch<SubcontractorSummary[]>("/subcontractors").catch(() => [])
      : Promise.resolve([]),
  ]);

  const vehicleQrSvg = await renderQrSvg(vehicleQrPayload(vehicle.id));

  const itsIncidents = incidents.filter((i) => i.vehicleId === id);
  const subcoName = subcontractors.find((s) => s.id === vehicle.subcoId)?.name;
  const inService = vehicle.status === "active";

  // "Open" means still needing a decision or a repair — dismissed and
  // repaired rows stay in the register as history but aren't work.
  const openDamage = damage.filter((d) => d.status === "reported" || d.status === "accepted");
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance ?? 0), 0);

  return (
    <PageShell width="medium">
      <BackLink href="/vehicles">Vehicles</BackLink>

      <DetailMasthead
        avatar={<VehicleAvatar bodyType={vehicle.bodyType} inService={inService} size="lg" />}
        title={vehicle.plate}
        titleMono
        subtitle={
          isGeneralAdmin
            ? `${BODY_TYPE_LABEL[vehicle.bodyType]} · ${subcoName ?? "Unknown subcontractor"}`
            : BODY_TYPE_LABEL[vehicle.bodyType]
        }
        // Open-damage only. The in-service status is owned by
        // VehicleStatusToggle in the actions row — same reasoning as the
        // driver page: one live source, no stale duplicate.
        status={
          openDamage.length > 0 ? (
            <StatusPill tone="bad">
              <TriangleAlert className="h-3 w-3" />
              {openDamage.length} open
            </StatusPill>
          ) : undefined
        }
        actions={<VehicleStatusToggle vehicleId={vehicle.id} status={vehicle.status} />}
      />

      <DetailStats
        stats={[
          { label: "Trips", value: trips.length, icon: <RouteIcon className="h-3.5 w-3.5" /> },
          {
            label: "Distance",
            value: totalDistance > 0 ? `${totalDistance.toLocaleString()} km` : "—",
            icon: <Gauge className="h-3.5 w-3.5" />,
          },
          {
            label: "Open damage",
            value: openDamage.length,
            icon: <TriangleAlert className="h-3.5 w-3.5" />,
            tone: openDamage.length > 0 ? "bad" : "neutral",
          },
          { label: "Documents", value: documents.length, icon: <FileText className="h-3.5 w-3.5" /> },
        ]}
      />

      <div className="flex flex-col gap-5">
        {/* The register leads — it is the reason this product exists. */}
        <SectionCard
          title="Damage register"
          description={
            damage.length === 0
              ? "Nothing recorded"
              : `${damage.length} recorded · ${openDamage.length} still open`
          }
          icon={<TriangleAlert className="h-4 w-4" />}
          flush
        >
          {damage.length === 0 ? (
            <EmptyState
              icon={<TriangleAlert className="h-5 w-5" />}
              title="No damage recorded"
              description="Damage reported by a driver on check-in or check-out appears here, and stays with the vehicle."
            />
          ) : (
            <DamageList vehicleId={vehicle.id} damage={damage} />
          )}
        </SectionCard>

        {/*
          The scannable tag for this vehicle. Print it, stick it in the
          cab, and a driver starting a trip scans it instead of typing a
          uuid off a screen — see fleetly-mobile's start-trip-view.
        */}
        <SectionCard
          title="Vehicle QR code"
          description="Print and fix inside the vehicle"
          icon={<QrCode className="h-4 w-4" />}
          flush
        >
          <QrCodePanel
            svg={vehicleQrSvg}
            title={vehicle.plate}
            caption="A driver scans this to start a trip on this vehicle."
            payload={vehicle.id}
          />
        </SectionCard>

        <SectionCard
          title="Trip history"
          description={`${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
          icon={<RouteIcon className="h-4 w-4" />}
          flush
        >
          <DetailTripList
            trips={trips.slice(0, 10)}
            secondary="driver"
            emptyTitle="No trips yet"
            emptyDescription="Trips appear here once a driver checks this vehicle out."
          />
        </SectionCard>

        <SectionCard
          title="Documents"
          description="Registration, insurance, technical control"
          icon={<FileText className="h-4 w-4" />}
          actions={
            <Link
              href="/documents"
              className="inline-flex min-h-8 items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              Manage
            </Link>
          }
          flush
        >
          <DetailDocumentList documents={documents} />
        </SectionCard>

        <SectionCard
          title="Incidents"
          description={`${itsIncidents.length} involving this vehicle`}
          icon={<TriangleAlert className="h-4 w-4" />}
          flush={itsIncidents.length === 0}
        >
          {itsIncidents.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-sm font-semibold text-ink">Nothing reported</p>
              <p className="mt-1 text-sm text-ink-3">
                No breakdown or new damage has been reported against this vehicle.
              </p>
            </div>
          ) : (
            <IncidentTimeline incidents={itsIncidents} />
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
