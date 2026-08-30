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
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getUnreadNotificationCountAction } from "@/app/notifications/actions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

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
 *
 * The active-state background is a single shared element animated
 * between links with Motion's `layoutId`, so changing page slides the
 * highlight rather than cross-fading two rectangles. Each rail gets its
 * own layout group id (the drawer and the desktop sidebar are mounted
 * at the same time on tablet widths, and sharing one id would make the
 * pill fly between them).
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
  const reduced = useReducedMotion();
  const groupId = useId();

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

    const link = (
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          "transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          collapsed && "justify-center px-0",
          isActive ? "text-brand-strong" : "text-ink-2 hover:bg-sunken hover:text-ink",
        )}
      >
        {isActive && (
          <motion.span
            layoutId={`${groupId}-active`}
            transition={reduced ? { duration: 0 } : springSnappy}
            className="absolute inset-0 -z-10 rounded-xl bg-brand-soft ring-1 ring-brand/15"
          />
        )}
        {isActive && !collapsed && (
          <motion.span
            layoutId={`${groupId}-rail`}
            transition={reduced ? { duration: 0 } : springSnappy}
            className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand"
          />
        )}
        <span className="relative shrink-0">
          <Icon
            className={cn(
              "h-[1.15rem] w-[1.15rem] transition-colors",
              isActive ? "text-brand" : "text-ink-3 group-hover:text-ink-2",
            )}
            strokeWidth={2}
          />
          {badge !== null && collapsed && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-brand ring-2 ring-paper" />
          )}
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
        <AnimatePresence>
          {badge !== null && !collapsed && (
            <motion.span
              key="badge"
              initial={reduced ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={springSnappy}
              className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 font-mono text-micro leading-none text-brand-ink"
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );

    // A collapsed rail is icon-only, so the label has to survive as a
    // tooltip — otherwise the nav is unusable without memorising icons.
    return collapsed ? (
      <Tooltip key={href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
          {badge !== null && ` · ${badge} unread`}
        </TooltipContent>
      </Tooltip>
    ) : (
      <div key={href}>{link}</div>
    );
  }

  return (
    <nav className={cn("flex flex-1 flex-col gap-6 overflow-y-auto py-4", collapsed ? "px-2.5" : "px-3")}>
      <div className="flex flex-col gap-1">{NAV_LINKS.map(renderLink)}</div>
      {isGeneralAdmin && (
        <div className="flex flex-col gap-1">
          {collapsed ? (
            <div className="mx-auto mb-1 h-px w-6 bg-line" />
          ) : (
            <p className="px-3 pb-1 font-mono text-micro font-medium tracking-[0.14em] text-ink-3 uppercase">
              Administration
            </p>
          )}
          {GENERAL_ADMIN_NAV_LINKS.map(renderLink)}
        </div>
      )}
    </nav>
  );
}
