"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Search / filter / sort / paginate for the roster screens, in one
 * place so every list behaves identically.
 *
 * Client-side, deliberately. These collections are bounded — a
 * subcontractor's drivers, vehicles, staff and subcontractors number in
 * the tens to low hundreds — and the page already fetches all of them
 * to render counts and totals. Filtering that in the browser is instant
 * and costs nothing extra; server-side paging here would mean a round
 * trip per keystroke and per page for no benefit at this size.
 *
 * The trip log is the exception and is NOT built on this: it grows
 * without bound, so it pages against the API instead.
 */

export interface SortOption<T> {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface FilterOption {
  id: string;
  label: string;
  /** Count shown alongside the label; omit to hide it. */
  count?: number;
}

export interface CollectionState<T> {
  /** The rows to render, after search + filter + sort + paging. */
  items: T[];
  /** Rows after search + filter, before paging — for "showing X of Y". */
  matched: number;
  total: number;
}

export function useCollection<T>({
  items,
  search,
  searchFields,
  sorts,
  filters,
  filterFn,
  pageSize = 12,
}: {
  items: T[];
  search: string;
  searchFields: (item: T) => (string | null | undefined)[];
  sorts?: SortOption<T>[];
  filters?: string;
  filterFn?: (item: T, filterId: string) => boolean;
  pageSize?: number;
}) {
  const [sortId, setSortId] = useState(sorts?.[0]?.id ?? "");
  const [page, setPage] = useState(0);

  // Changing what is being searched or filtered puts you back at the
  // top of the new results. Without this, typing a search while on page
  // 2 leaves you on page 2 of the *new* set — technically a valid page,
  // but never what someone means by "search". Adjusted during render
  // (react.dev's documented pattern, and this codebase's convention for
  // it) so the corrected page applies to this render, not the next.
  //
  // `effectivePage` rather than reading `page` again below: both this
  // block and the range clamp can call setPage in the same render, and
  // the clamp — computing from the stale `page` — would otherwise queue
  // its value last and silently undo the reset.
  const [prevQuery, setPrevQuery] = useState({ search, filters });
  let effectivePage = page;
  if (prevQuery.search !== search || prevQuery.filters !== filters) {
    setPrevQuery({ search, filters });
    effectivePage = 0;
  }

  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = items;
    if (q) {
      out = out.filter((item) =>
        searchFields(item)
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q)),
      );
    }
    if (filters && filters !== "all" && filterFn) {
      out = out.filter((item) => filterFn(item, filters));
    }
    const sort = sorts?.find((s) => s.id === sortId);
    if (sort) out = [...out].sort(sort.compare);
    return out;
  }, [items, search, searchFields, filters, filterFn, sorts, sortId]);

  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  // Adjust during render rather than in an effect: when a filter
  // narrows the results the current page can fall off the end, and the
  // corrected page must be used by *this* render, not the next one.
  const safePage = Math.min(effectivePage, pageCount - 1);
  if (safePage !== page) setPage(safePage);

  const paged = matched.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return {
    items: paged,
    matched: matched.length,
    total: items.length,
    page: safePage,
    pageCount,
    setPage,
    sortId,
    setSortId,
    pageSize,
  };
}

/** Search field with a clear affordance. */
export function CollectionSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1 sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-xl border border-line bg-paper pr-9 pl-9 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Segmented filter chips. */
export function CollectionFilters({
  options,
  value,
  onChange,
}: {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors",
              active
                ? "border-brand/30 bg-brand-soft text-brand-strong"
                : "border-line bg-paper text-ink-2 hover:bg-sunken hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("font-mono", active ? "text-brand" : "text-ink-3")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Sort control — a native select, styled by the global select rule. */
export function CollectionSort<T>({
  sorts,
  value,
  onChange,
}: {
  sorts: SortOption<T>[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort by"
        className="h-9 rounded-xl border border-line bg-paper pl-8 text-xs font-medium text-ink-2 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
      >
        {sorts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Pager. Renders nothing at a single page — a control that can only be
 * in one state is noise.
 */
export function CollectionPager({
  page,
  pageCount,
  matched,
  total,
  pageSize,
  onPage,
  noun = "records",
}: {
  page: number;
  pageCount: number;
  matched: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  noun?: string;
}) {
  // With nothing matching, the list itself already renders a "no
  // {noun} match" empty state — repeating it here just printed the same
  // sentence twice, one above the other.
  if (matched === 0) return null;

  const from = page * pageSize + 1;
  const to = Math.min(matched, (page + 1) * pageSize);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-3">
        Showing <span className="font-mono text-ink-2">{from}</span>–
        <span className="font-mono text-ink-2">{to}</span> of{" "}
        <span className="font-mono text-ink-2">{matched}</span> {noun}
        {matched !== total && <> (filtered from {total})</>}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPage(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <span className="px-1 font-mono text-xs text-ink-2">
            {page + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount - 1}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Toolbar row wrapper — search left, filters and sort right. */
export function CollectionToolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}
