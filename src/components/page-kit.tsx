"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { springSoft } from "@/lib/motion";
import { AnimatedNumber } from "@/components/motion-primitives";

/**
 * The building blocks every screen composes from. Kept deliberately
 * small and unopinionated about layout: the point of this file is that
 * headers, tiles and empty states are *consistent*, while each page
 * stays free to arrange them differently (a bento dashboard, a dense
 * table, a card grid, a timeline). Uniform primitives, varied
 * compositions — the opposite of every page sharing one template.
 *
 * All icons come in as `React.ReactNode`, never as a component
 * reference: these are client components, and a server page cannot pass
 * a function across that boundary.
 */

export type Tone = "brand" | "ok" | "warn" | "bad" | "info" | "viz-2" | "viz-3" | "neutral";

const TONE_SURFACE: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  "viz-2": "bg-viz-2/10 text-viz-2",
  "viz-3": "bg-viz-3/10 text-viz-3",
  neutral: "bg-sunken text-ink-2",
};

const TONE_BAR: Record<Tone, string> = {
  brand: "bg-brand",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  info: "bg-info",
  "viz-2": "bg-viz-2",
  "viz-3": "bg-viz-3",
  neutral: "bg-line-2",
};

/**
 * Consistent page gutter + max width. Four measures, chosen by what the
 * screen is rather than by taste:
 *   full   — the dashboard bento, which wants every pixel
 *   wide   — tables and card grids
 *   medium — feeds and detail views, kept near a comfortable reading measure
 *   narrow — forms, which get harder to scan the wider the fields grow
 */
export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "full" | "wide" | "medium" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        width === "full" && "max-w-[110rem]",
        width === "wide" && "max-w-6xl",
        width === "medium" && "max-w-3xl",
        width === "narrow" && "max-w-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page title block. The eyebrow + oversized display title + supporting
 * line gives each screen a real masthead instead of a bare h1, and the
 * optional `icon` ties it to its sidebar entry.
 */
export function PageHeader({
  title,
  description,
  icon,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand/15">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 font-mono text-[0.68rem] font-medium tracking-[0.14em] text-ink-3 uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="truncate font-display text-2xl font-semibold text-ink sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/**
 * A KPI tile. `value` of null means the underlying request failed and
 * the tile shows an em dash rather than a misleading zero.
 */
export function StatTile({
  label,
  value,
  icon,
  tone = "brand",
  href,
  hint,
  className,
}: {
  label: string;
  value: number | null;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
  hint?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  const body = (
    <motion.div
      whileHover={reduced || !href ? undefined : { scale: 1.015 }}
      whileTap={reduced || !href ? undefined : { scale: 0.995 }}
      transition={springSoft}
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-line bg-paper p-4 shadow-sm",
        href && "transition-shadow hover:shadow-md",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5 opacity-70", TONE_BAR[tone])} />
      <div className="mb-3 flex items-start justify-between gap-2">
        {icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", TONE_SURFACE[tone])}>
            {icon}
          </span>
        )}
        {hint && <span className="font-mono text-[0.65rem] text-ink-3">{hint}</span>}
      </div>
      <AnimatedNumber
        value={value}
        data-testid="stat-value"
        className="block font-mono text-[1.75rem] leading-none font-semibold text-ink"
      />
      <p className="mt-1.5 text-xs text-ink-2">{label}</p>
    </motion.div>
  );

  return href ? (
    <Link href={href} className="block h-full rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Titled panel. `flush` drops the inner padding for tables/lists. */
export function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  flush = false,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-paper shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="shrink-0 text-ink-3">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="truncate font-display text-sm font-semibold text-ink">{title}</h2>}
              {description && <p className="truncate text-xs text-ink-3">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

/** Consistent zero-state. Always says what to do next, not just "none". */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-3">{icon}</span>
      )}
      <div>
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}

/** Back-navigation affordance for detail and form screens. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-paper transition-colors group-hover:border-line-2 group-hover:bg-sunken">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </Link>
  );
}

/** Small status pill. */
export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-medium",
        TONE_SURFACE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Live dot — a pulsing ring behind a solid centre. */
export function LiveDot({ tone = "ok", className }: { tone?: Tone; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)}>
      <span className={cn("absolute inline-flex h-full w-full animate-pulse-ring rounded-full", TONE_BAR[tone])} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", TONE_BAR[tone])} />
    </span>
  );
}
