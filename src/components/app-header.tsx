import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

interface AppHeaderProps {
  email: string | undefined;
  isGeneralAdmin: boolean;
}

export function AppHeader({ email, isGeneralAdmin }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
      <Link
        href="/"
        className="font-sans text-lg font-extrabold tracking-tight text-ink"
      >
        Fleetly
      </Link>
      <div className="flex items-center gap-4">
        {isGeneralAdmin && (
          <Link
            href="/staff"
            className="text-sm font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Staff
          </Link>
        )}
        <span className="text-sm text-ink-2">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
