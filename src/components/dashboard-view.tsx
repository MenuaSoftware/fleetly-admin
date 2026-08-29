"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CircleAlert,
  Plus,
  Route as RouteIcon,
  Smartphone,
  TriangleAlert,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { DriverSummary, IncidentSummary, PendingDeviceSummary, TripSummary, VehicleSummary } from "@/lib/types";
import { PageShell, SectionCard, StatTile, EmptyState, LiveDot, StatusPill } from "@/components/page-kit";
import { AuroraBackdrop, Stagger, StaggerItem } from "@/components/motion-primitives";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

export interface DashboardData {
  activeTrips: TripSummary[] | null;
  completedTrips: TripSummary[] | null;
  pendingDevices: PendingDeviceSummary[] | null;
  unreadNotifications: number | null;
  incidents: IncidentSummary[] | null;
  drivers: DriverSummary[] | null;
  vehicles: VehicleSummary[] | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * A horizontal utilisation bar. Deliberately not a chart library: two
 * divs and a transform beat ~50KB of JS for a single ratio, and it
 * animates on the compositor.
 */
function UtilBar({
  label,
  value,
  total,
  tone,
  delay = 0,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        <span className="font-mono text-xs text-ink-3">
          <span className="text-ink">{value}</span>
          <span className="text-ink-3">/{total}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sunken">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay }}
        />
      </div>
    </div>
  );
}

/**
 * The dispatcher's landing screen. Composed as a bento — tiles of
 * deliberately different weights and shapes — rather than another
 * uniform card grid, so the eye lands on fleet status first and the
 * page reads differently from every list screen behind it.
 *
 * Every figure is real, from the same endpoints the rest of the panel
 * uses. A failed request degrades its own tile to an em dash instead of
 * taking the page down, and never renders a misleading zero.
 */
export function DashboardView({ data, email }: { data: DashboardData; email?: string }) {
  const {
    activeTrips,
    completedTrips,
    pendingDevices,
    unreadNotifications,
    incidents,
    drivers,
    vehicles,
  } = data;

  const recentIncidents = (incidents ?? []).slice(0, 4);
  const liveTrips = (activeTrips ?? []).slice(0, 5);

  const activeDrivers = drivers?.filter((d) => d.status === "active").length ?? 0;
  const activeVehicles = vehicles?.filter((v) => v.status === "active").length ?? 0;
  const driversOnRoad = new Set((activeTrips ?? []).map((t) => t.driverId)).size;
  const vehiclesInUse = new Set((activeTrips ?? []).map((t) => t.vehicleId)).size;

  const firstName = email?.split("@")[0]?.split(/[._-]/)[0];
  const greetName = firstName ? firstName[0].toUpperCase() + firstName.slice(1) : null;

  return (
    <PageShell width="full">
      {/* Masthead */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-paper px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <AuroraBackdrop />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <LiveDot tone="ok" />
              <span className="font-mono text-[0.68rem] tracking-[0.14em] text-ink-3 uppercase">
                Fleet live
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {greetName ? `Welcome back, ${greetName}` : "Fleet overview"}
            </h1>
            <p className="mt-1.5 max-w-lg text-sm text-ink-2">
              {activeTrips === null
                ? "Live trip data is unavailable right now."
                : activeTrips.length === 0
                  ? "No trips are running. The fleet is idle."
                  : `${activeTrips.length} ${activeTrips.length === 1 ? "trip is" : "trips are"} on the road right now.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_2px_12px_-2px_rgb(var(--brand-glow)/0.5)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <RouteIcon className="h-4 w-4" />
              View trips
            </Link>
            <Link
              href="/trips/reconcile"
              className="inline-flex items-center gap-2 rounded-xl border border-line-2 bg-paper px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              <Wrench className="h-4 w-4" />
              Reconcile
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <Stagger className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaggerItem>
          <StatTile
            label="Trips on the road"
            value={activeTrips?.length ?? null}
            icon={<RouteIcon className="h-4.5 w-4.5" />}
            tone="ok"
            href="/trips"
            hint="live"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Devices to approve"
            value={pendingDevices?.length ?? null}
            icon={<Smartphone className="h-4.5 w-4.5" />}
            tone="warn"
            href="/devices"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Unread notifications"
            value={unreadNotifications}
            icon={<Bell className="h-4.5 w-4.5" />}
            tone="viz-2"
            href="/notifications"
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Incidents reported"
            value={incidents?.length ?? null}
            icon={<TriangleAlert className="h-4.5 w-4.5" />}
            tone="bad"
            href="/incidents"
          />
        </StaggerItem>
      </Stagger>

      {/* Bento */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live trips — the widest tile, because it is the thing a
            dispatcher actually watches. */}
        <SectionCard
          className="lg:col-span-2"
          title="On the road"
          description="Trips currently open"
          icon={<RouteIcon className="h-4 w-4" />}
          actions={
            <Link
              href="/trips"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              All trips
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
          flush
        >
          {liveTrips.length === 0 ? (
            <EmptyState
              icon={<RouteIcon className="h-5 w-5" />}
              title={activeTrips === null ? "Trips unavailable" : "Nothing on the road"}
              description={
                activeTrips === null
                  ? "The trips service did not respond. Other tiles are unaffected."
                  : "Open trips appear here the moment a driver starts one."
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {liveTrips.map((trip, i) => (
                <motion.li
                  key={trip.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3, ease: EASE_OUT }}
                >
                  <Link
                    href={`/trips/${trip.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
                  >
                    <LiveDot tone="ok" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {trip.driverName ?? "Unknown driver"}
                        <span className="mx-1.5 text-ink-3">·</span>
                        <span className="font-mono text-xs text-ink-2">{trip.vehiclePlate ?? "—"}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-3">
                        {trip.origin} · started {relativeTime(trip.startedAt)}
                      </p>
                    </div>
                    <span className="hidden font-mono text-xs text-ink-3 sm:block">
                      {trip.startOdometer.toLocaleString()} km
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors group-hover:text-brand" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Fleet utilisation */}
        <SectionCard
          title="Fleet utilisation"
          description="In use vs. available"
          icon={<Truck className="h-4 w-4" />}
        >
          <div className="flex flex-col gap-4">
            <UtilBar
              label="Vehicles in use"
              value={vehiclesInUse}
              total={activeVehicles}
              tone="bg-viz-3"
              delay={0.1}
            />
            <UtilBar
              label="Drivers on the road"
              value={driversOnRoad}
              total={activeDrivers}
              tone="bg-viz-5"
              delay={0.18}
            />
            <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
              <Link
                href="/vehicles"
                className="rounded-xl border border-line p-3 transition-colors hover:bg-sunken"
              >
                <Truck className="mb-1.5 h-4 w-4 text-viz-3" />
                <p className="font-mono text-lg leading-none font-semibold text-ink">
                  {vehicles?.length ?? "—"}
                </p>
                <p className="mt-1 text-[0.7rem] text-ink-3">Vehicles</p>
              </Link>
              <Link
                href="/drivers"
                className="rounded-xl border border-line p-3 transition-colors hover:bg-sunken"
              >
                <Users className="mb-1.5 h-4 w-4 text-viz-5" />
                <p className="font-mono text-lg leading-none font-semibold text-ink">
                  {drivers?.length ?? "—"}
                </p>
                <p className="mt-1 text-[0.7rem] text-ink-3">Drivers</p>
              </Link>
            </div>
          </div>
        </SectionCard>

        {/* Incidents */}
        <SectionCard
          className="lg:col-span-2"
          title="Recent incidents"
          description="Breakdowns and new damage"
          icon={<TriangleAlert className="h-4 w-4" />}
          actions={
            <Link
              href="/incidents"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              All incidents
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
          flush
        >
          {recentIncidents.length === 0 ? (
            <EmptyState
              icon={<TriangleAlert className="h-5 w-5" />}
              title={incidents === null ? "Incidents unavailable" : "No incidents reported"}
              description={
                incidents === null
                  ? "The incidents service did not respond."
                  : "Drivers report breakdowns and new damage from the mobile app."
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {recentIncidents.map((inc) => (
                <li key={inc.id}>
                  <Link
                    href="/incidents"
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-sunken sm:px-5"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        inc.type === "breakdown" ? "bg-warn-bg text-warn" : "bg-bad-bg text-bad",
                      )}
                    >
                      {inc.type === "breakdown" ? (
                        <Wrench className="h-3.5 w-3.5" />
                      ) : (
                        <CircleAlert className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {inc.driverName ?? "Unknown driver"}
                        <span className="mx-1.5 text-ink-3">·</span>
                        <span className="font-mono text-xs text-ink-2">{inc.vehiclePlate ?? "—"}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-3">{inc.note}</p>
                    </div>
                    <StatusPill tone={inc.type === "breakdown" ? "warn" : "bad"}>
                      {inc.type === "breakdown" ? "breakdown" : "damage"}
                    </StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Quick actions + throughput */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Quick actions" icon={<Plus className="h-4 w-4" />}>
            <div className="flex flex-col gap-1.5">
              {[
                { href: "/drivers/new", label: "Add a driver", icon: Users },
                { href: "/vehicles/new", label: "Add a vehicle", icon: Truck },
                { href: "/devices", label: "Approve a device", icon: Smartphone },
                { href: "/trips/reconcile", label: "Reconcile a trip", icon: Wrench },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                >
                  <Icon className="h-4 w-4 text-ink-3 transition-colors group-hover:text-brand" />
                  {label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Completed" description="Trips closed out" icon={<RouteIcon className="h-4 w-4" />}>
            <p className="font-mono text-3xl leading-none font-semibold text-ink">
              {completedTrips?.length ?? "—"}
            </p>
            <p className="mt-2 text-xs text-ink-3">
              Closed trips retain their odometer readings, photos and confirmations.
            </p>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
