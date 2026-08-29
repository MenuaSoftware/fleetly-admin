"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

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
 */
export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
      <button
        type="button"
        onClick={() => {
          const idx = OPTIONS.findIndex((o) => o.value === theme);
          setTheme(OPTIONS[(idx + 1) % OPTIONS.length].value);
        }}
        title={`Theme: ${current.label}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-wash hover:text-ink"
      >
        {mounted ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-line-2 bg-wash p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          title={label}
          className={`flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors ${
            mounted && theme === value ? "bg-paper text-ink shadow-sm" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
