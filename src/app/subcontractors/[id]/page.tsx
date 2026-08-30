import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  FileStack,
  Route as RouteIcon,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { apiFetch, ApiError, getMe } from "@/lib/api";
import type {
  DocumentTypeSummary,
  DriverSummary,
  StaffSummary,
  SubcontractorSummary,
  TripSummary,
  VehicleSummary,
} from "@/lib/types";
import { BackLink, EmptyState, PageShell, SectionCard, StatusPill } from "@/components/page-kit";
import { DetailMasthead, DetailStats, DetailTripList } from "@/components/detail-kit";
import { RenameSubcontractorForm } from "@/components/rename-subcontractor-form";

/**
 * One subcontractor — the client this fleet is run on behalf of.
 *
 * Everything here is derived by filtering the general admin's own
 * unfiltered lists by subcoId, rather than through per-subco endpoints
 * that don't exist. That is honest for this screen: it is
 * general-admin-only, and a general admin's /drivers and /vehicles are
 * already the full set by RLS, so no extra round trip would be saved by
 * filtering server-side. Trips are the exception — that list can grow
 * without bound, so those come back already narrowed per driver rather
 * than pulling the whole history down to count it.
 */
export default async function SubcontractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const subcontractor = await apiFetch<SubcontractorSummary>(`/subcontractors/${id}`).catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
  if (!subcontractor) notFound();

  const [drivers, vehicles, staff, documentTypes] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers").catch(() => []),
    apiFetch<VehicleSummary[]>("/vehicles").catch(() => []),
    apiFetch<StaffSummary[]>("/staff").catch(() => []),
    apiFetch<DocumentTypeSummary[]>("/document-types").catch(() => []),
  ]);

  const theirDrivers = drivers.filter((d) => d.subcoId === id);
  const theirVehicles = vehicles.filter((v) => v.subcoId === id);
  const theirStaff = staff.filter((s) => s.subcoId === id);
  // Types scoped to this subco, not the global defaults every subco shares.
  const theirDocTypes = documentTypes.filter((t) => t.subcoId === id);

  // Recent activity across their drivers. Capped deliberately: this is a
  // snapshot on an overview screen, not the trip log.
  const tripLists = await Promise.all(
    theirDrivers
      .slice(0, 12)
      .map((d) =>
        apiFetch<TripSummary[]>(`/trips?driverId=${encodeURIComponent(d.id)}`).catch(() => []),
      ),
  );
  const trips = tripLists
    .flat()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const activeDrivers = theirDrivers.filter((d) => d.status === "active").length;
  const inServiceVehicles = theirVehicles.filter((v) => v.status === "active").length;

  return (
    <PageShell width="medium">
      <BackLink href="/subcontractors">Subcontractors</BackLink>

      <DetailMasthead
        avatar={
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/15"
          >
            <Building2 className="h-6 w-6" />
          </span>
        }
        title={subcontractor.name}
        subtitle="Client subcontractor"
        status={<StatusPill tone="neutral">{theirStaff.length} staff</StatusPill>}
        actions={<RenameSubcontractorForm id={subcontractor.id} name={subcontractor.name} />}
      />

      <DetailStats
        stats={[
          {
            label: "Drivers",
            value: `${activeDrivers}/${theirDrivers.length}`,
            icon: <Users className="h-3.5 w-3.5" />,
          },
          {
            label: "Vehicles",
            value: `${inServiceVehicles}/${theirVehicles.length}`,
            icon: <Truck className="h-3.5 w-3.5" />,
          },
          { label: "Trips", value: trips.length, icon: <RouteIcon className="h-3.5 w-3.5" /> },
          { label: "Staff", value: theirStaff.length, icon: <UserCog className="h-3.5 w-3.5" /> },
        ]}
      />

      <div className="flex flex-col gap-5">
        <SectionCard
          title="Drivers"
          description={`${activeDrivers} active of ${theirDrivers.length}`}
          icon={<Users className="h-4 w-4" />}
          actions={
            <Link
              href="/drivers"
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              Manage
            </Link>
          }
          flush
        >
          {theirDrivers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No drivers yet"
              description="Drivers added against this subcontractor appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {theirDrivers.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/drivers/${d.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
                  >
                    <span className="truncate text-sm font-medium text-ink">
                      {d.firstName} {d.lastName}
                    </span>
                    <StatusPill tone={d.status === "active" ? "ok" : "neutral"}>{d.status}</StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Vehicles"
          description={`${inServiceVehicles} in service of ${theirVehicles.length}`}
          icon={<Truck className="h-4 w-4" />}
          actions={
            <Link
              href="/vehicles"
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              Manage
            </Link>
          }
          flush
        >
          {theirVehicles.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-5 w-5" />}
              title="No vehicles yet"
              description="Vehicles added against this subcontractor appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {theirVehicles.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
                  >
                    <span className="truncate font-mono text-sm font-medium text-ink">{v.plate}</span>
                    <StatusPill tone={v.status === "active" ? "ok" : "warn"}>
                      {v.status === "active" ? "in service" : "out of service"}
                    </StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent trips"
          description={`${trips.length} across their drivers`}
          icon={<RouteIcon className="h-4 w-4" />}
          flush
        >
          <DetailTripList
            trips={trips.slice(0, 8)}
            secondary="driver"
            emptyTitle="No trips yet"
            emptyDescription="Trips run by this subcontractor's drivers appear here."
          />
        </SectionCard>

        <SectionCard
          title="Staff"
          description="Dispatchers and admins on this subcontractor"
          icon={<UserCog className="h-4 w-4" />}
          flush
        >
          {theirStaff.length === 0 ? (
            <EmptyState
              icon={<UserCog className="h-5 w-5" />}
              title="No staff assigned"
              description="Invite a dispatcher and assign them to this subcontractor."
            />
          ) : (
            <ul className="divide-y divide-line">
              {theirStaff.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/staff/${s.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
                  >
                    <span className="truncate text-sm font-medium text-ink">
                      {s.firstName} {s.lastName}
                    </span>
                    <StatusPill tone={s.role === "general_admin" ? "viz-2" : "info"}>
                      {s.role === "general_admin" ? "General admin" : "Dispatcher"}
                    </StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Document types"
          description="Scoped to this subcontractor, beyond the global defaults"
          icon={<FileStack className="h-4 w-4" />}
          actions={
            <Link
              href="/document-types"
              className="rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              Manage
            </Link>
          }
          flush
        >
          {theirDocTypes.length === 0 ? (
            <EmptyState
              icon={<FileStack className="h-5 w-5" />}
              title="No subcontractor-specific types"
              description="They use the global defaults. Clone those onto this subcontractor to customise them."
            />
          ) : (
            <ul className="divide-y divide-line">
              {theirDocTypes.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <span className="truncate text-sm font-medium text-ink">{t.name}</span>
                  <span className="font-mono text-xs text-ink-3">
                    {t.attachedTo} · {t.alertWindowDays}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
