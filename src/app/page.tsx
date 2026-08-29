import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { DashboardView, type DashboardData } from "@/components/dashboard-view";
import type {
  DriverSummary,
  IncidentSummary,
  PendingDeviceSummary,
  TripSummary,
  VehicleSummary,
} from "@/lib/types";

/**
 * The overview a dispatcher lands on. Every number is a real count from
 * the same endpoints the rest of the panel already uses, not a mocked
 * metric. Each request is settled independently so one dead endpoint
 * degrades a single tile rather than taking the whole page down — the
 * same reasoning this codebase already applies elsewhere.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    activeTrips,
    completedTrips,
    pendingDevices,
    unreadNotifications,
    incidents,
    drivers,
    vehicles,
  ] = await Promise.all([
    apiFetch<TripSummary[]>("/trips?state=active").catch(() => null),
    apiFetch<TripSummary[]>("/trips?state=completed").catch(() => null),
    apiFetch<PendingDeviceSummary[]>("/devices/pending").catch(() => null),
    apiFetch<{ id: string }[]>("/notifications?unread=true").catch(() => null),
    apiFetch<IncidentSummary[]>("/incidents").catch(() => null),
    apiFetch<DriverSummary[]>("/drivers").catch(() => null),
    apiFetch<VehicleSummary[]>("/vehicles").catch(() => null),
  ]);

  const data: DashboardData = {
    activeTrips,
    completedTrips,
    pendingDevices,
    unreadNotifications: unreadNotifications?.length ?? null,
    incidents,
    drivers,
    vehicles,
  };

  return <DashboardView data={data} email={user?.email} />;
}
