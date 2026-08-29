"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * A three-way segmented control, not a single toggle — "system" is a
 * real, meaningful third state (follows the OS), not just a compromise
 * between the other two. Renders a neutral placeholder until mounted:
 * `theme` is only known client-side (it reads localStorage), so
 * rendering the real icons before hydration would either mismatch or
 * flash the wrong one.
 *
 * The selected segment is one shared element animated between positions
 * with `layoutId`, so switching slides rather than blinks.
 */
export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();
  // Same "detect hydration has completed" shape as app-shell.tsx's own
  // hydrated flag — no prop to compare during render, genuinely a
  // lifecycle boundary; the sanctioned use of an effect this lint rule
  // still allows.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (collapsed) {
    const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
    const Icon = current.icon;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              const idx = OPTIONS.findIndex((o) => o.value === theme);
              setTheme(OPTIONS[(idx + 1) % OPTIONS.length].value);
            }}
            aria-label={`Theme: ${current.label}. Click to change.`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            {mounted ? (
              <motion.span
                key={current.value}
                initial={reduced ? false : { rotate: -35, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={springSnappy}
                className="flex"
              >
                <Icon className="h-4 w-4" />
              </motion.span>
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Theme: {current.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-lg border border-line-2 bg-sunken p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            aria-label={label}
            className={cn(
              "relative flex flex-1 items-center justify-center rounded-md px-2 py-1.5 transition-colors",
              active ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-active"
                transition={reduced ? { duration: 0 } : springSnappy}
                className="absolute inset-0 rounded-md bg-paper shadow-sm"
              />
            )}
            <Icon className="relative h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
