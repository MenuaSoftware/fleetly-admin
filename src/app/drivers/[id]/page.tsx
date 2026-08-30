import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Gauge,
  Route as RouteIcon,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { apiFetch, ApiError, getMe } from "@/lib/api";
import type {
  DocumentSummary,
  DriverSummary,
  IncidentSummary,
  SubcontractorSummary,
  TripSummary,
} from "@/lib/types";
import { BackLink, PageShell, SectionCard, StatusPill } from "@/components/page-kit";
import { InitialsAvatar } from "@/components/entity-grid";
import {
  DetailDocumentList,
  DetailMasthead,
  DetailStats,
  DetailTripList,
} from "@/components/detail-kit";
import { IncidentTimeline } from "@/components/incident-timeline";
import { DriverStatusToggle } from "@/components/driver-status-toggle";
import { IssueBadgeButton } from "@/components/issue-badge-button";
import { RevokeDeviceButton } from "@/components/revoke-device-button";

/**
 * One driver, everything about them. Until now a driver existed only as
 * a row in a list with two buttons on it — there was no way to answer
 * "what has this person actually been doing?" without cross-referencing
 * three other screens.
 *
 * The trip list is fetched server-side with the new ?driverId= filter
 * rather than pulled down whole and filtered here. Incidents have no
 * such filter (the endpoint is a small subco-wide feed by design), so
 * those are narrowed in memory; if that feed ever grows, it wants the
 * same treatment as trips.
 *
 * Everything except the driver record itself degrades to an empty
 * section rather than taking the page down — the same "a dead endpoint
 * shouldn't cost you the whole screen" rule the dashboard follows.
 */
export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const driver = await apiFetch<DriverSummary>(`/drivers/${id}`).catch((err) => {
    // A driver that doesn't exist, or that RLS hides from this
    // dispatcher, is a 404 either way — the API deliberately doesn't
    // distinguish them, and neither should this page.
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
  if (!driver) notFound();

  const [trips, documents, incidents, subcontractors] = await Promise.all([
    apiFetch<TripSummary[]>(`/trips?driverId=${encodeURIComponent(id)}`).catch(() => []),
    apiFetch<DocumentSummary[]>(`/documents?driverId=${encodeURIComponent(id)}`).catch(() => []),
    apiFetch<IncidentSummary[]>("/incidents").catch(() => []),
    isGeneralAdmin
      ? apiFetch<SubcontractorSummary[]>("/subcontractors").catch(() => [])
      : Promise.resolve([]),
  ]);

  const theirIncidents = incidents.filter((i) => i.driverId === id);
  const name = `${driver.firstName} ${driver.lastName}`;
  const subcoName = subcontractors.find((s) => s.id === driver.subcoId)?.name;
  const active = driver.status === "active";

  // Only completed trips carry a distance; summing the nulls of open
  // trips would understate nothing but read as if it had.
  const totalDistance = trips.reduce((sum, t) => sum + (t.distance ?? 0), 0);

  return (
    <PageShell width="medium">
      <BackLink href="/drivers">Drivers</BackLink>

      <DetailMasthead
        avatar={<InitialsAvatar name={name} tone={active ? "brand" : "neutral"} />}
        title={name}
        subtitle={isGeneralAdmin ? (subcoName ?? "Unknown subcontractor") : undefined}
        // Only the device pill here. The active/inactive status is owned
        // by DriverStatusToggle in the actions row below — it holds the
        // live value after a toggle, so a second pill up here would both
        // duplicate it and go stale the moment someone clicks.
        status={
          <StatusPill tone={driver.approvedDeviceId ? "info" : "neutral"}>
            <Smartphone className="h-3 w-3" />
            {driver.approvedDeviceId ? "device enrolled" : "no device"}
          </StatusPill>
        }
        actions={
          <>
            <DriverStatusToggle driverId={driver.id} status={driver.status} />
            {driver.approvedDeviceId ? (
              <RevokeDeviceButton deviceId={driver.approvedDeviceId} />
            ) : (
              <IssueBadgeButton driverId={driver.id} />
            )}
          </>
        }
      />

      <DetailStats
        stats={[
          {
            label: "Trips",
            value: trips.length,
            icon: <RouteIcon className="h-3.5 w-3.5" />,
          },
          {
            label: "Distance",
            value: totalDistance > 0 ? `${totalDistance.toLocaleString()} km` : "—",
            icon: <Gauge className="h-3.5 w-3.5" />,
          },
          {
            label: "Incidents",
            value: theirIncidents.length,
            icon: <TriangleAlert className="h-3.5 w-3.5" />,
            tone: theirIncidents.length > 0 ? "bad" : "neutral",
          },
          {
            label: "Documents",
            value: documents.length,
            icon: <FileText className="h-3.5 w-3.5" />,
          },
        ]}
      />

      <div className="flex flex-col gap-5">
        <SectionCard
          title="Trip history"
          description={`${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
          icon={<RouteIcon className="h-4 w-4" />}
          flush
        >
          <DetailTripList
            trips={trips.slice(0, 10)}
            secondary="vehicle"
            emptyTitle="No trips yet"
            emptyDescription="Trips appear here once this driver opens one from the mobile app."
          />
        </SectionCard>

        <SectionCard
          title="Documents"
          description="Licences and personal paperwork"
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
          title="Incidents reported"
          description={`${theirIncidents.length} from this driver`}
          icon={<TriangleAlert className="h-4 w-4" />}
          flush={theirIncidents.length === 0}
        >
          {theirIncidents.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-sm font-semibold text-ink">Nothing reported</p>
              <p className="mt-1 text-sm text-ink-3">
                This driver has not reported a breakdown or new damage.
              </p>
            </div>
          ) : (
            <IncidentTimeline incidents={theirIncidents} />
          )}
        </SectionCard>

        <SectionCard title="Device" icon={<Smartphone className="h-4 w-4" />}>
          {driver.approvedDeviceId ? (
            <p className="text-sm text-ink-2">
              One approved device.{" "}
              <span className="font-mono text-xs text-ink-3">{driver.approvedDeviceId}</span>
            </p>
          ) : (
            <p className="text-sm text-ink-2">
              No approved device — this driver cannot sign in to the mobile app yet. Issue a badge,
              then approve their phone from{" "}
              <Link href="/devices" className="font-medium text-brand hover:text-brand-strong">
                Devices
              </Link>
              .
            </p>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
