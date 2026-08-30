"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, LogOut, Monitor, Moon, ShieldCheck, Sun, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function initials(email: string | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const picked = parts.length > 1 ? [parts[0], parts[1]] : [local.slice(0, 2)];
  return picked
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

/**
 * Account control in the topbar: who you are, what theme you're on, and
 * the way out. These used to sit in the sidebar footer, where they were
 * invisible whenever the rail was collapsed and competed with
 * navigation for the same space. The topbar is where every other
 * product puts them, and it means they don't move when the sidebar does.
 *
 * Theme lives inside this menu rather than as a separate always-visible
 * control: it is set once and then forgotten, so it does not earn
 * permanent topbar real estate.
 */
export function AccountMenu({
  email,
  isGeneralAdmin,
}: {
  email: string | undefined;
  isGeneralAdmin: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-9 items-center gap-2 rounded-xl border border-line bg-paper pr-2.5 pl-1.5 transition-colors hover:border-line-2 hover:bg-sunken"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-soft font-display text-micro font-semibold text-brand">
            {initials(email)}
          </span>
          <span className="hidden max-w-[10rem] truncate text-xs text-ink-2 lg:inline">{email}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-start gap-2.5 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft font-display text-xs font-semibold text-brand">
            {initials(email)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{email ?? "Signed in"}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-ink-3">
              {isGeneralAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
              {isGeneralAdmin ? "General admin" : "Dispatcher"}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-ink-3">Theme</DropdownMenuLabel>
        <DropdownMenuGroup>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onSelect={(e) => {
                // Keep the menu open so the theme change is visible
                // where it was made, rather than only after it closes.
                e.preventDefault();
                setTheme(value);
              }}
            >
              <Icon />
              {label}
              <Check
                className={cn("ml-auto h-3.5 w-3.5", theme === value ? "opacity-100" : "opacity-0")}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" disabled={signingOut} onSelect={handleSignOut}>
          <LogOut />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
