"use client";

import { useCallback } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A highlight that follows the pointer across a card.
 *
 * Exposed as a hook rather than a wrapper component because the
 * highlight has to live *inside* the card it lights — as a sibling
 * overlay it would either sit above the content or need its own
 * stacking context fighting the card's. The hook hands back a move
 * handler; the card takes the `spotlight` class and renders
 * `<span {...spot.layerProps} />` as its first child.
 *
 * No ref: the handler reads `e.currentTarget`, which is already the
 * element the listener sits on. That removes the ref entirely (React
 * Compiler's `react-hooks/refs` rule correctly objects to a hook
 * handing a ref back out to be attached during render) and is less code
 * besides.
 *
 * The pointer position is written straight to the node as CSS custom
 * properties rather than held in React state: this runs on every
 * pointermove, and a state update per frame would re-render the card
 * (and in a grid, fight with its siblings) for a purely visual effect.
 * Two custom-property writes are a style recalc on one node, with no
 * React render at all.
 *
 * Disabled under reduced motion — it is decorative, and a gradient
 * chasing the cursor is exactly what that setting asks us not to do.
 */
export function useSpotlight() {
  const reduced = useReducedMotion();

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }, []);

  return {
    enabled: !reduced,
    onPointerMove: reduced ? undefined : onPointerMove,
    /** Spread onto a span rendered as the card's first child. */
    layerProps: { "aria-hidden": true as const, className: "spotlight-layer" },
  };
}

/** Ready-made surface for cards that need no extra wiring. */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const spot = useSpotlight();
  return (
    <div onPointerMove={spot.onPointerMove} className={cn("spotlight group/card", className)}>
      {spot.enabled && <span {...spot.layerProps} />}
      {children}
    </div>
  );
}
