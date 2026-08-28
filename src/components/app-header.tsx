"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUnreadNotificationCountAction } from "@/app/notifications/actions";
import { SignOutButton } from "@/components/sign-out-button";

interface AppHeaderProps {
  email: string | undefined;
  isGeneralAdmin: boolean;
}

const NAV_LINKS = [
  { href: "/trips", label: "Trips" },
  { href: "/incidents", label: "Incidents" },
  { href: "/notifications", label: "Notifications" },
  { href: "/drivers", label: "Drivers" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/devices", label: "Devices" },
] as const;

const GENERAL_ADMIN_NAV_LINKS = [
  { href: "/staff", label: "Staff" },
  { href: "/document-types", label: "Document types" },
  { href: "/retention", label: "Retention" },
] as const;

export function AppHeader({ email, isGeneralAdmin }: AppHeaderProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Refetches on every route change, not just on mount — the count
  // needs to drop after marking things read on /notifications, and pick
  // up anything new when navigating back to it later. A Server Action
  // (not a direct fetch to the API) is what makes this callable from a
  // client component at all — see getUnreadNotificationCountAction's own
  // comment for why (apiFetch is otherwise server-only, and the API has
  // no CORS story built).
  useEffect(() => {
    let cancelled = false;
    getUnreadNotificationCountAction().then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-sans text-lg font-extrabold tracking-tight text-ink">
          Fleetly
        </Link>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith(href) ? "text-accent" : "text-ink-2 hover:text-ink"
              }`}
            >
              {label}
              {href === "/notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
          {isGeneralAdmin &&
            GENERAL_ADMIN_NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(href) ? "text-accent" : "text-ink-2 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-2">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
