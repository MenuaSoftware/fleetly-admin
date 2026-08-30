"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * The thin bar across the top of the app while a route is loading.
 *
 * The per-route `loading.tsx` skeletons cover the moment *after* a
 * navigation commits, but nothing covered the gap before that — the
 * server component is still fetching, the old page is still on screen,
 * and clicking felt like nothing happened. On a fast local API that gap
 * is short; against a real one it is exactly where a user starts
 * clicking again.
 *
 * Started by a capture-phase click listener on internal links rather
 * than by `useLinkStatus`: that hook only reports for the Link it sits
 * inside, so a global bar would need every link in the app wrapped.
 * Listening once at the document catches every anchor — including ones
 * inside components that know nothing about this — and `start()` is
 * exported for programmatic navigation (the command palette), which no
 * click listener could see.
 *
 * Finishing is driven by `pathname` changing, with a timeout as the
 * backstop for a navigation that never completes (a link to the current
 * route, or one the router rejects) so the bar can never stick.
 */

const RouteProgressContext = createContext<{ start: () => void }>({ start: () => {} });

export function useRouteProgress() {
  return useContext(RouteProgressContext);
}

const STALL_MS = 8000;

export function RouteProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setActive(true);
    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = setTimeout(() => setActive(false), STALL_MS);
  }, []);

  // Any click on an in-app link begins a navigation. Capture phase so we
  // still see it if the handler below stops propagation; modified clicks
  // and new-tab targets are skipped because they don't navigate here.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || anchor.getAttribute("target") === "_blank") return;
      // A link to where we already are commits nothing, so pathname
      // never changes and the bar would rely on the stall timeout.
      if (href === pathname) return;
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, start]);

  // The route committed — clear the bar and the stall guard.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (active) setActive(false);
  }

  useEffect(() => {
    if (active) return;
    if (stallTimer.current) {
      clearTimeout(stallTimer.current);
      stallTimer.current = null;
    }
  }, [active]);

  return (
    <RouteProgressContext.Provider value={{ start }}>
      <AnimatePresence>
        {active && !reduced && (
          <motion.div
            key="route-progress"
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Creeps toward 90% and waits there: the real duration is
                unknowable, and a bar that reaches 100% before the page
                does is a lie. The commit is what completes it. */}
            <motion.div
              className="h-full origin-left bg-brand shadow-[0_0_8px_rgb(var(--brand-glow)/0.7)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 0.9 }}
              transition={{ duration: 6, ease: [0.1, 0.9, 0.2, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </RouteProgressContext.Provider>
  );
}
