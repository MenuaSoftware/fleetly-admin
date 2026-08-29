"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/trips": "Trips",
  "/incidents": "Incidents",
  "/notifications": "Notifications",
  "/drivers": "Drivers",
  "/vehicles": "Vehicles",
  "/documents": "Documents",
  "/devices": "Devices",
  "/subcontractors": "Subcontractors",
  "/staff": "Staff",
  "/document-types": "Document types",
  "/retention": "Retention",
};

function pageTitleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  const match = Object.entries(PAGE_TITLES).find(([href]) => href !== "/" && pathname.startsWith(href));
  return match?.[1] ?? segments[0]?.replace(/-/g, " ") ?? "Fleetly";
}

/**
 * The dashboard shell: a persistent, collapsible sidebar on desktop
 * (width persisted to localStorage — a per-viewer convenience, not
 * data anything else needs), an off-canvas drawer on mobile, and a
 * slim topbar carrying the mobile menu trigger + current page title +
 * theme/account controls. Only ever rendered for a signed-in request
 * (see layout.tsx) — login/accept-invite render bare.
 */
export function AppShell({
  email,
  isGeneralAdmin,
  children,
}: {
  email: string | undefined;
  isGeneralAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Detecting "hydration has completed" has no prop/state to compare
  // against during render — it's genuinely a lifecycle boundary, not a
  // value to derive — and localStorage doesn't exist during SSR at all,
  // so this can only ever run client-side, after mount. Both of these
  // are the officially-sanctioned "subscribe to an external system"
  // shape react-hooks/set-state-in-effect still allows, unlike the
  // mobile-drawer-close-on-navigate case right below, which genuinely
  // is a prop-driven case and is handled during render instead.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHydrated(true);
    setCollapsed(localStorage.getItem("fleetly:sidebar-collapsed") === "1");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Adjust state during render (react.dev's own documented pattern for
  // this, not an effect) — closes the mobile drawer the instant
  // pathname changes, same "prevX state + compare during render"
  // approach document-type-list.tsx already established for this exact
  // lint rule.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fleetly:sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-wash">
      {/* Desktop sidebar */}
      <aside
        style={{ width: hydrated && collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
        className="hidden shrink-0 flex-col border-r border-line bg-paper transition-[width] duration-200 ease-out md:flex"
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-line ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {!collapsed && (
            <Link href="/" className="font-sans text-lg font-extrabold tracking-tight text-ink">
              Fleetly
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-sans text-sm font-extrabold text-white">
              F
            </Link>
          )}
        </div>

        <SidebarNav isGeneralAdmin={isGeneralAdmin} collapsed={collapsed} />

        <div className="shrink-0 border-t border-line p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs text-ink-3">{email}</p>
              <ThemeToggle />
            </div>
          )}
          {collapsed && (
            <div className="mb-2 flex justify-center">
              <ThemeToggle collapsed />
            </div>
          )}
          <div className={collapsed ? "flex justify-center" : ""}>
            <SignOutButton iconOnly={collapsed} />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-9 shrink-0 items-center justify-center border-t border-line text-ink-3 transition-colors hover:bg-wash hover:text-ink"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in-left flex-col bg-paper shadow-lg">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <Link href="/" className="font-sans text-lg font-extrabold tracking-tight text-ink">
                Fleetly
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-wash"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav isGeneralAdmin={isGeneralAdmin} onNavigate={() => setMobileOpen(false)} />
            <div className="shrink-0 border-t border-line p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs text-ink-3">{email}</p>
                <ThemeToggle />
              </div>
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-wash md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 truncate text-base font-semibold text-ink">{pageTitleFor(pathname)}</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
