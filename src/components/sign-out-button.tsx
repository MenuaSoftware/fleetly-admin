"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        title="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-2 text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:opacity-60"
      >
        <LogOut className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-line-2 px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
