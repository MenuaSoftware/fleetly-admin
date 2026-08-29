"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Bell,
  Building2,
  FileStack,
  FileText,
  LayoutDashboard,
  Route,
  Smartphone,
  TriangleAlert,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUnreadNotificationCountAction } from "@/app/notifications/actions";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/incidents", label: "Incidents", icon: TriangleAlert },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/devices", label: "Devices", icon: Smartphone },
];

const GENERAL_ADMIN_NAV_LINKS: NavLink[] = [
  { href: "/subcontractors", label: "Subcontractors", icon: Building2 },
  { href: "/staff", label: "Staff", icon: UserCog },
  { href: "/document-types", label: "Document types", icon: FileStack },
  { href: "/retention", label: "Retention", icon: Archive },
];

/**
 * The link list itself — shared between the desktop sidebar and the
 * mobile drawer, both of which just wrap this in their own chrome.
 * `collapsed` swaps labels for a centered icon + tooltip-via-title,
 * matching the icon-rail pattern of most modern dashboard sidebars.
 */
export function SidebarNav({
  isGeneralAdmin,
  collapsed = false,
  onNavigate,
}: {
  isGeneralAdmin: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getUnreadNotificationCountAction().then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function renderLink({ href, label, icon: Icon }: NavLink) {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    const badge = href === "/notifications" && unreadCount > 0 ? unreadCount : null;

    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? "justify-center" : ""
        } ${
          isActive
            ? "bg-accent-soft text-accent-strong"
            : "text-ink-2 hover:bg-wash hover:text-ink"
        }`}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
        )}
        <Icon className={`h-[1.15rem] w-[1.15rem] shrink-0 ${isActive ? "text-accent" : ""}`} strokeWidth={2} />
        {!collapsed && <span className="truncate">{label}</span>}
        {badge !== null && (
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[0.6875rem] leading-none text-white ${
              collapsed ? "absolute -right-0.5 -top-0.5" : "ml-auto"
            }`}
          >
            {collapsed ? "" : badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-1">{NAV_LINKS.map(renderLink)}</div>
      {isGeneralAdmin && (
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
              Administration
            </p>
          )}
          {GENERAL_ADMIN_NAV_LINKS.map(renderLink)}
        </div>
      )}
    </nav>
  );
}
