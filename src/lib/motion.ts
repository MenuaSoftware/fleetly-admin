import type { Transition, Variants } from "motion/react";

/**
 * One motion vocabulary for the whole panel, so timing and easing are a
 * decision made once rather than re-improvised per component.
 *
 * Everything here animates `transform` and `opacity` only — the two
 * properties the compositor can handle without laying out or painting
 * again. Animating width/height/top/left is what makes a dashboard feel
 * janky under load, and this is a dashboard that renders long tables.
 *
 * Durations sit in the 150–350ms band: below ~120ms motion reads as a
 * glitch, above ~400ms it starts to feel like waiting.
 */

/** Decelerating curve for things entering the screen. */
export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
/** Symmetric curve for things moving between two on-screen states. */
export const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.7,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.6,
};

/** Parent that releases its children in sequence. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

/** Child of `staggerContainer` — rises slightly as it fades in. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: EASE_OUT },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.14 } },
};

/** Off-canvas drawer. */
export const drawerPanel: Variants = {
  hidden: { x: "-100%" },
  show: { x: 0, transition: springSnappy },
  exit: { x: "-100%", transition: { duration: 0.2, ease: EASE_IN_OUT } },
};

export const drawerScrim: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

/**
 * Card lift on hover. Scale rather than a y-translate + shadow change,
 * because scale composites cleanly and doesn't nudge neighbours.
 */
export const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.012, transition: springSnappy },
  tap: { scale: 0.995 },
};
