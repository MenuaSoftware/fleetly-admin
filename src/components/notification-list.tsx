"use client";

import Link from "next/link";
import { useState } from "react";
import { markNotificationReadAction } from "@/app/notifications/actions";
import { NotificationSummary } from "@/lib/types";

const TYPE_LABEL: Record<NotificationSummary["type"], string> = {
  incident: "Incident",
  document_expiry: "Document expiring",
};

const TYPE_BADGE_CLASS: Record<NotificationSummary["type"], string> = {
  incident: "bg-bad-bg text-bad",
  document_expiry: "bg-warn-bg text-warn",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Owns its own list state, same pattern as damage-list.tsx — marking one
 * read updates that row in place, no page refresh needed.
 *
 * incidents have no per-id detail page yet (incidents/page.tsx is
 * deliberately a flat feed — see its own comment), so an 'incident'
 * notification links to /incidents in general rather than a specific
 * entry; document_expiry has no admin document page at all yet, so it
 * renders as plain text. Neither link fakes a capability that doesn't
 * exist.
 */
export function NotificationList({ notifications: initial }: { notifications: NotificationSummary[] }) {
  const [notifications, setNotifications] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkRead(id: string) {
    setBusyId(id);
    setError(null);
    const result = await markNotificationReadAction(id);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }

  if (notifications.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-ink-3">No notifications.</p>;
  }

  return (
    <div>
      {error && (
        <p role="alert" className="border-b border-line px-5 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <ul>
        {notifications.map((n, i) => (
          <li
            key={n.id}
            data-testid={`notification-${n.id}`}
            className={`flex items-start justify-between gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""} ${
              n.readAt ? "" : "bg-brand-soft"
            }`}
          >
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 font-mono text-xs ${TYPE_BADGE_CLASS[n.type]}`}>
                  {TYPE_LABEL[n.type]}
                </span>
                {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />}
              </div>
              <p className="text-sm text-ink">{n.message}</p>
              <p className="mt-1 text-xs text-ink-3">
                {formatWhen(n.createdAt)}
                {n.type === "incident" && (
                  <>
                    {" · "}
                    <Link href="/incidents" className="text-brand hover:text-brand-strong">
                      view incidents
                    </Link>
                  </>
                )}
              </p>
            </div>
            {!n.readAt && (
              <button
                type="button"
                onClick={() => handleMarkRead(n.id)}
                disabled={busyId === n.id}
                className="shrink-0 rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
              >
                {busyId === n.id ? "…" : "Mark read"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
