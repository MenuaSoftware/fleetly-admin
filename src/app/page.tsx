import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
        <span className="font-sans text-lg font-extrabold tracking-tight text-ink">
          Fleetly
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-2">{user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-ink-3">
          Signed in. The dispatcher panel starts here.
        </p>
      </div>
    </main>
  );
}
