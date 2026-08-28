import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe } from "@/lib/types";
import { AppHeader } from "@/components/app-header";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Degrades to "no admin nav" rather than crashing the page if the API
  // is unreachable — a dead API shouldn't take the whole shell down with
  // it, just the parts that need it.
  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-ink-3">
          Signed in. The dispatcher panel starts here.
        </p>
      </div>
    </main>
  );
}
