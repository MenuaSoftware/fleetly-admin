"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * next-themes toggles a `.dark` class on <html> and persists the choice
 * to localStorage, with a blocking inline script (injected by this
 * provider) that reads it before first paint — no flash of the wrong
 * theme, and no hydration mismatch, both of which a hand-rolled
 * useEffect-based toggle can't avoid. `enableSystem` makes "system" a
 * real third option, following the OS's own light/dark preference.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
