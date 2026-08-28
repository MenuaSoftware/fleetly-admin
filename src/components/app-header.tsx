"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

interface AppHeaderProps {
  email: string | undefined;
  isGeneralAdmin: boolean;
}

const NAV_LINKS = [
  { href: "/drivers", label: "Drivers" },
  { href: "/vehicles", label: "Vehicles" },
] as const;

export function AppHeader({ email, isGeneralAdmin }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-sans text-lg font-extrabold tracking-tight text-ink">
          Fleetly
        </Link>
        <nav className="flex items-center gap-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(href) ? "text-accent" : "text-ink-2 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
          {isGeneralAdmin && (
            <Link
              href="/staff"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/staff") ? "text-accent" : "text-ink-2 hover:text-ink"
              }`}
            >
              Staff
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-2">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
