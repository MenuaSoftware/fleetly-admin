"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { drawerPanel, drawerScrim, springSoft } from "@/lib/motion";

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

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand font-display text-sm font-bold text-brand-ink shadow-[0_2px_10px_-2px_rgb(var(--brand-glow)/0.55)]">
        F
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-ink">Fleetly</span>
      )}
    </Link>
  );
}

/**
 * The dashboard shell: a persistent, collapsible sidebar on desktop
 * (width persisted to localStorage — a per-viewer convenience, not
 * data anything else needs), an off-canvas drawer on mobile, and a
 * frosted topbar carrying the mobile menu trigger and current page
 * title. Only ever rendered for a signed-in request (see layout.tsx) —
 * login/accept-invite render bare.
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
  const reduced = useReducedMotion();
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

  // Escape closes the drawer — expected of any modal surface, and the
  // scrim alone doesn't serve keyboard users.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fleetly:sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  const isCollapsed = hydrated && collapsed;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-wash">
        {/* Desktop sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
          transition={reduced ? { duration: 0 } : springSoft}
          className="hidden shrink-0 flex-col border-r border-line bg-paper md:flex"
        >
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-line",
              isCollapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <Wordmark compact={isCollapsed} />
          </div>

          <SidebarNav isGeneralAdmin={isGeneralAdmin} collapsed={isCollapsed} />

          <div className={cn("shrink-0 border-t border-line p-3", isCollapsed && "px-2")}>
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <ThemeToggle collapsed />
                <SignOutButton iconOnly />
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-ink-3" title={email}>
                    {email}
                  </p>
                  <ThemeToggle />
                </div>
                <SignOutButton />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 shrink-0 items-center justify-center border-t border-line text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </motion.aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                variants={drawerScrim}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              />
              <motion.aside
                variants={drawerPanel}
                initial={reduced ? false : "hidden"}
                animate="show"
                exit="exit"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                className="absolute inset-y-0 left-0 flex w-68 flex-col border-r border-line bg-paper shadow-lg"
              >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                  <Wordmark />
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
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
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 md:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate font-display text-base font-semibold text-ink">
                {pageTitleFor(pathname)}
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
