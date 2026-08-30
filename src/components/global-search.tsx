"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  Building2,
  FileStack,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  Route as RouteIcon,
  Search,
  Smartphone,
  TriangleAlert,
  Truck,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { loadSearchIndexAction, type SearchKind, type SearchRecord } from "@/app/search/actions";
import { useRouteProgress } from "@/components/route-progress";

const KIND_ICON: Record<SearchKind, React.ComponentType<{ className?: string }>> = {
  driver: Users,
  vehicle: Truck,
  subcontractor: Building2,
  staff: UserCog,
};

const KIND_LABEL: Record<SearchKind, string> = {
  driver: "Drivers",
  vehicle: "Vehicles",
  subcontractor: "Subcontractors",
  staff: "Staff",
};

const KIND_ORDER: SearchKind[] = ["driver", "vehicle", "subcontractor", "staff"];

/** Rows rendered per group. A palette nobody scrolls does not need more. */
const RESULT_LIMIT = 6;

interface NavTarget {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const PAGES: NavTarget[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Trips", href: "/trips", icon: RouteIcon },
  { label: "Incidents", href: "/incidents", icon: TriangleAlert },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Drivers", href: "/drivers", icon: Users },
  { label: "Vehicles", href: "/vehicles", icon: Truck },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Devices", href: "/devices", icon: Smartphone },
  { label: "Subcontractors", href: "/subcontractors", icon: Building2, adminOnly: true },
  { label: "Staff", href: "/staff", icon: UserCog, adminOnly: true },
  { label: "Document types", href: "/document-types", icon: FileStack, adminOnly: true },
  { label: "Retention", href: "/retention", icon: Archive, adminOnly: true },
];

const ACTIONS: NavTarget[] = [
  { label: "New driver", href: "/drivers/new", icon: Plus },
  { label: "New vehicle", href: "/vehicles/new", icon: Plus },
  { label: "Reconcile a trip", href: "/trips/reconcile", icon: Wrench },
  { label: "Invite staff", href: "/staff/invite", icon: Plus, adminOnly: true },
];

/**
 * Command palette: ⌘K / Ctrl-K anywhere, or the topbar search field.
 *
 * The record index is fetched the first time the palette opens and kept
 * for the rest of the session — see loadSearchIndexAction for why one
 * up-front payload beats per-keystroke server search here. Pages and
 * actions are static and always available, so the palette is useful the
 * instant it opens, before any fetch resolves.
 *
 * Filtering is done here rather than by cmdk (see the note above the
 * filter below). Records carry a prebuilt lowercase haystack so a
 * vehicle is findable by body type or subcontractor, not only by plate.
 */
export function GlobalSearch({ isGeneralAdmin }: { isGeneralAdmin: boolean }) {
  const router = useRouter();
  const progress = useRouteProgress();
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const openRef = useRef(false);
  const loadStarted = useRef(false);

  /**
   * Opening the palette is what causes the fetch, so it happens in the
   * handler rather than in an effect watching `open`. That is the "you
   * might not need an effect" case from React's own docs — and an
   * effect here would have to set `loading` synchronously in its body,
   * cascading a render before the request had even started.
   *
   * Fetched once per session: most sessions never open the palette, and
   * this is several list requests, so it is not worth doing on mount.
   * `loadStarted` guards against a second open racing the first fetch.
   */
  const handleOpenChange = useCallback((next: boolean) => {
    // Mirrored into a ref so the ⌘K handler can toggle without this
    // callback depending on `open` (which would re-bind the listener on
    // every open/close). Only ever read inside events, never in render.
    openRef.current = next;
    setOpen(next);
    if (!next) setQuery("");
    if (!next || loadStarted.current) return;
    loadStarted.current = true;
    setLoading(true);
    loadSearchIndexAction()
      .then((r) => setRecords(r))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenChange(!openRef.current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleOpenChange]);

  const go = useCallback(
    (href: string) => {
      handleOpenChange(false);
      // Started by hand: this navigation comes from router.push(), which
      // the progress bar's click listener can't observe.
      progress.start();
      router.push(href);
    },
    [router, handleOpenChange, progress],
  );

  /**
   * Filtering is ours, not cmdk's (`shouldFilter={false}`), and each
   * group renders at most RESULT_LIMIT rows.
   *
   * cmdk's own filter hides non-matching items but keeps them all
   * mounted, so the whole index pays render cost on every open and
   * every keystroke — measured at ~100ms and 3 dropped frames on open
   * with only ~40 records, and it grows with the roster. Matching the
   * prebuilt `match` haystacks ourselves and slicing means the palette
   * costs the same whether the index holds forty records or four
   * thousand.
   */
  const q = query.trim().toLowerCase();
  const matches = (haystack: string) => !q || haystack.includes(q);

  const pages = PAGES.filter(
    (p) => (!p.adminOnly || isGeneralAdmin) && matches(`${p.label} page`.toLowerCase()),
  ).slice(0, RESULT_LIMIT);

  const actions = ACTIONS.filter(
    (a) => (!a.adminOnly || isGeneralAdmin) && matches(`${a.label} action`.toLowerCase()),
  ).slice(0, RESULT_LIMIT);

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: (records ?? []).filter((r) => r.kind === kind && matches(r.match)).slice(0, RESULT_LIMIT),
  })).filter((g) => g.items.length > 0);

  const nothingMatches = grouped.length === 0 && pages.length === 0 && actions.length === 0;

  return (
    <>
      {/* Topbar trigger. A button styled as a field rather than a real
          input: it opens a dialog that owns the actual input, and a
          nested focusable input would take a keystroke to escape. */}
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Search"
        className="group flex h-9 w-full max-w-xs items-center gap-2 rounded-xl border border-line bg-paper px-3 text-left text-sm text-ink-3 transition-colors hover:border-line-2 hover:bg-sunken md:w-64"
      >
        <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-ink-2" />
        <span className="flex-1 truncate">Search…</span>
        <kbd className="hidden shrink-0 rounded-md border border-line-2 bg-sunken px-1.5 py-0.5 font-mono text-micro text-ink-3 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        shouldFilter={false}
        open={open}
        onOpenChange={handleOpenChange}
        title="Search Fleetly"
        description="Find a driver, vehicle, subcontractor or page"
      >
        <CommandInput
          placeholder="Search drivers, vehicles, pages…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {nothingMatches && (
          <CommandEmpty>
            {loading ? (
              <span className="flex items-center justify-center gap-2 text-sm text-ink-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading records…
              </span>
            ) : (
              "Nothing matches that."
            )}
          </CommandEmpty>
          )}

          {grouped.map(({ kind, items }) => {
            const Icon = KIND_ICON[kind];
            return (
              <CommandGroup key={kind} heading={KIND_LABEL[kind]}>
                {items.map((r) => (
                  <CommandItem key={`${r.kind}-${r.id}`} value={r.match} onSelect={() => go(r.href)}>
                    <Icon className="text-ink-3" />
                    <span className="truncate">{r.title}</span>
                    {r.subtitle && (
                      <span className="ml-auto truncate pl-3 text-xs text-ink-3">{r.subtitle}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}

          {grouped.length > 0 && <CommandSeparator />}

          {pages.length > 0 && (
          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.href} value={`${p.label} page`} onSelect={() => go(p.href)}>
                <p.icon className="text-ink-3" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
          )}

          {actions.length > 0 && (
          <CommandGroup heading="Actions">
            {actions.map((a) => (
              <CommandItem key={a.href} value={`${a.label} action`} onSelect={() => go(a.href)}>
                <a.icon className="text-ink-3" />
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
