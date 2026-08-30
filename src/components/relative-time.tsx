"use client";

import { useCallback, useSyncExternalStore } from "react";

function format(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Never fires — the value only needs to be read once, after hydration. */
const noopSubscribe = () => () => {};

/**
 * Renders an absolute timestamp as "3d ago".
 *
 * A client component on purpose. Computing this on the server reads the
 * *server's* clock at request time, which is stale the moment the page
 * is cached or the tab is left open, and calling Date.now() during
 * render is impure (the React Compiler flags it, correctly).
 *
 * useSyncExternalStore rather than an effect + setState: it is built for
 * exactly this — a value whose server snapshot (`fallback`) and client
 * snapshot (the formatted time) legitimately differ — and it gets there
 * without a post-mount state update, so there's no cascading render for
 * the lint rule to object to. getSnapshot returns a string, so React's
 * Object.is check compares by value and stays stable between renders.
 */
export function RelativeTime({
  iso,
  fallback = "never",
  className,
}: {
  iso: string | null;
  fallback?: string;
  className?: string;
}) {
  const getSnapshot = useCallback(() => (iso ? format(iso) : fallback), [iso, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const text = useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
