"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, FileWarning, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotificationFeedAction } from "@/app/notifications/actions";
import type { NotificationSummary } from "@/lib/types";
import { playNotificationChime } from "@/lib/notification-sound";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

/** How often to look for new notifications. */
const POLL_MS = 20_000;

function iconFor(type: NotificationSummary["type"]) {
  return type === "incident" ? TriangleAlert : FileWarning;
}

function toneFor(type: NotificationSummary["type"]) {
  return type === "incident" ? "text-bad" : "text-warn";
}

function whenLabel(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Topbar notification bell: unread count, a preview of the newest few,
 * and a live toast + chime when something arrives while you are looking
 * at another screen.
 *
 * Polling rather than a socket. The API has no realtime channel, and a
 * dispatcher panel does not need sub-second latency for "a document is
 * expiring" — a 20s poll of one small endpoint is the honest amount of
 * machinery for the requirement.
 *
 * The first poll only establishes a baseline: without that, every page
 * load would announce every existing notification as if it had just
 * arrived. Only ids that appear in a *later* poll are treated as new.
 */
export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const [unread, setUnread] = useState(0);
  const [recent, setRecent] = useState<NotificationSummary[]>([]);
  const [open, setOpen] = useState(false);

  // Ids seen in a previous poll. Held in a ref, not state: it is
  // bookkeeping for the comparison, and re-rendering when it changes
  // would achieve nothing.
  const seen = useRef<Set<string> | null>(null);

  const announce = useCallback(
    (arrivals: NotificationSummary[]) => {
      playNotificationChime();
      for (const n of arrivals.slice(0, 3)) {
        toast(n.message, {
          description: n.type === "incident" ? "Incident reported" : "Document expiring",
          action: {
            label: "View",
            onClick: () => router.push("/notifications"),
          },
        });
      }
      // More than three at once becomes noise; summarise the rest.
      if (arrivals.length > 3) {
        toast(`${arrivals.length - 3} more notifications arrived`, {
          action: { label: "View all", onClick: () => router.push("/notifications") },
        });
      }
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const feed = await getNotificationFeedAction().catch(() => null);
      if (cancelled || !feed) return;

      setUnread(feed.unread);
      setRecent(feed.recent);

      const ids = new Set(feed.recent.map((n) => n.id));
      if (seen.current === null) {
        // Baseline pass — everything here already existed.
        seen.current = ids;
        return;
      }
      const arrivals = feed.recent.filter((n) => !seen.current!.has(n.id) && n.readAt === null);
      seen.current = ids;
      if (arrivals.length > 0) announce(arrivals);
    }

    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // pathname is a dependency so the count refreshes immediately after
    // navigating (notably away from /notifications, having read some).
  }, [announce, pathname]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-paper text-ink-2 transition-colors hover:border-line-2 hover:bg-sunken hover:text-ink"
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={springSnappy}
                className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 font-mono text-[0.6rem] leading-none font-semibold text-brand-ink ring-2 ring-paper"
              >
                {unread > 99 ? "99+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <p className="font-display text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <span className="font-mono text-xs text-brand">{unread} unread</span>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="px-3.5 py-8 text-center text-sm text-ink-3">Nothing yet.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {recent.map((n, i) => {
              const Icon = iconFor(n.type);
              return (
                <motion.li
                  key={n.id}
                  initial={reduced ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.22 }}
                >
                  <Link
                    href="/notifications"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-sunken",
                      n.readAt === null && "bg-brand-soft/40",
                    )}
                  >
                    <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", toneFor(n.type))} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{n.message}</span>
                      <span className="mt-0.5 block font-mono text-[0.68rem] text-ink-3">
                        {whenLabel(n.createdAt)}
                      </span>
                    </span>
                    {n.readAt === null && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}

        <Link
          href="/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-line px-3.5 py-2.5 text-center text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
