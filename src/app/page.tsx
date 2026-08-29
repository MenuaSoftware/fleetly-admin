import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Plus,
  Route as RouteIcon,
  Smartphone,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { IncidentSummary, PendingDeviceSummary, TripSummary } from "@/lib/types";

const STAT_CARDS = [
  { key: "active", label: "Active trips", href: "/trips", icon: RouteIcon, tone: "ok" as const },
  { key: "devices", label: "Devices to approve", href: "/devices", icon: Smartphone, tone: "warn" as const },
  { key: "notifications", label: "Unread notifications", href: "/notifications", icon: Bell, tone: "accent" as const },
  { key: "incidents", label: "Recent incidents", href: "/incidents", icon: TriangleAlert, tone: "bad" as const },
];

const TONE_CLASS = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  accent: "bg-accent-soft text-accent",
  bad: "bg-bad-bg text-bad",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * The overview a dispatcher lands on — a placeholder ("Signed in. The
 * dispatcher panel starts here.") until now. Every number here is a
 * real count from the same endpoints the rest of the panel already
 * uses, not a mocked-up metric; degrades a single card to "—" rather
 * than the whole page if one call fails, same "a dead API shouldn't
 * take the whole shell down" reasoning this codebase already applies
 * elsewhere.
 */
export default async function Home() {
  const [activeTrips, pendingDevices, unreadNotifications, incidents] = await Promise.all([
    apiFetch<TripSummary[]>("/trips?state=active").catch(() => null),
    apiFetch<PendingDeviceSummary[]>("/devices/pending").catch(() => null),
    apiFetch<{ id: string }[]>("/notifications?unread=true").catch(() => null),
    apiFetch<IncidentSummary[]>("/incidents").catch(() => null),
  ]);

  const counts: Record<string, number | null> = {
    active: activeTrips?.length ?? null,
    devices: pendingDevices?.length ?? null,
    notifications: unreadNotifications?.length ?? null,
    incidents: incidents?.length ?? null,
  };

  const recentIncidents = (incidents ?? []).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-4xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-3">A snapshot of the fleet right now.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, href, icon: Icon, tone }) => (
          <Link
            key={key}
            href={href}
            className="group rounded-2xl border border-line bg-paper p-4 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <p className="font-mono text-2xl font-semibold text-ink">{counts[key] ?? "—"}</p>
            <p className="text-xs text-ink-3">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent incidents</h2>
            <Link href="/incidents" className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-strong">
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
            {recentIncidents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <TriangleAlert className="h-7 w-7 text-ink-3" strokeWidth={1.5} />
                <p className="text-sm text-ink-3">No incidents reported.</p>
              </div>
            ) : (
              <ul>
                {recentIncidents.map((inc, i) => (
                  <li key={inc.id} className={`px-4 py-3 text-sm ${i > 0 ? "border-t border-line" : ""}`}>
                    <p className="font-medium text-ink">
                      {inc.driverName ?? "Unknown driver"}
                      <span className="text-ink-3"> · </span>
                      <span className="font-mono text-xs">{inc.vehiclePlate ?? "—"}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-3">
                      {formatWhen(inc.capturedAt)} — {inc.note}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Quick actions</h2>
          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-2 shadow-sm">
            {[
              { href: "/drivers/new", label: "New driver", icon: Plus },
              { href: "/vehicles/new", label: "New vehicle", icon: Plus },
              { href: "/trips/reconcile", label: "Reconcile a trip", icon: Wrench },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-wash hover:text-ink"
              >
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
