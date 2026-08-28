import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { InviteForm } from "@/components/invite-form";

interface SubcontractorSummary {
  id: string;
  name: string;
}

export default async function InviteStaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors");

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin />
      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Invite staff</h1>
          <p className="text-sm text-ink-3">
            They&rsquo;ll get an email to set their own password.
          </p>
        </div>
        <InviteForm subcontractors={subcontractors} />
      </div>
    </main>
  );
}
