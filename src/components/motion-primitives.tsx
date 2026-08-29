"use client";

import { motion, useInView, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, staggerItem, springSoft } from "@/lib/motion";

/**
 * Small set of animation wrappers used across the panel. They exist so
 * pages can compose motion without every page re-declaring variants —
 * and so `prefers-reduced-motion` is handled in one place instead of
 * being forgotten in twenty.
 *
 * Note the CSS in globals.css already collapses animation *durations*
 * under reduced motion; these components additionally skip the initial
 * offset, so content never starts shifted and then snaps.
 */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="show"
      variants={fadeInUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent for a list/grid whose children should cascade in. */
export function Stagger({
  children,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[As];
  return (
    <MotionTag
      className={className}
      initial={reduced ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
    >
      {children}
    </MotionTag>
  );
}

/** Child of `Stagger`. */
export function StaggerItem({
  children,
  className,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const MotionTag = motion[As];
  return (
    <MotionTag className={className} variants={staggerItem}>
      {children}
    </MotionTag>
  );
}

/** Fades/rises in once it actually scrolls into view. */
export function RevealOnView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : "hidden"}
      animate={inView ? "show" : "hidden"}
      variants={fadeInUp}
    >
      {children}
    </motion.div>
  );
}

function AnimatedDigits({ value, mv }: { value: number; mv: MotionValue<number> }) {
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [text, setText] = useState(() => Math.round(mv.get()).toLocaleString());
  useEffect(() => rounded.on("change", setText), [rounded]);
  useEffect(() => {
    mv.set(value);
  }, [mv, value]);
  return <>{text}</>;
}

/**
 * Counts up to `value` on mount. Used for the dashboard KPIs — a number
 * that animates into place reads as live data rather than a static
 * figure, which is the whole point of a dashboard tile.
 *
 * Falls back to the plain number under reduced motion, and renders the
 * `fallback` (an em dash) when the underlying fetch failed, so a dead
 * endpoint never animates a misleading zero.
 */
export function AnimatedNumber({
  value,
  className,
  fallback = "—",
  ...rest
}: {
  value: number | null;
  className?: string;
  fallback?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const reduced = useReducedMotion();
  // Deliberately quick (~400ms to settle). A slower count-up looks
  // pleasant in isolation but leaves the tile showing a number that
  // contradicts the summary line right above it while it climbs.
  const spring = useSpring(0, { stiffness: 190, damping: 26, mass: 0.5 });

  if (value === null) return <span className={className} {...rest}>{fallback}</span>;
  if (reduced) return <span className={className} {...rest}>{value.toLocaleString()}</span>;

  return (
    <span className={className} {...rest}>
      <AnimatedDigits value={value} mv={spring} />
    </span>
  );
}

/**
 * Interactive surface that lifts slightly under the pointer. Scale-only
 * so it composites on the GPU and never nudges its neighbours (a
 * translate-based lift in a grid causes visible reflow of the row).
 */
export function LiftCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={cn("h-full", className)}
      whileHover={reduced ? undefined : { scale: 1.012 }}
      whileTap={reduced ? undefined : { scale: 0.995 }}
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}

/**
 * Ambient brand-tinted glow behind a hero surface. Purely decorative,
 * pointer-events-none, and cheap: two blurred radial blobs on a slow
 * transform loop, no per-frame JS.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -top-24 -left-16 h-64 w-64 animate-aurora rounded-full bg-brand/16 blur-3xl" />
      <div
        className="absolute -top-10 right-0 h-56 w-56 animate-aurora rounded-full bg-viz-2/14 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
    </div>
  );
}
