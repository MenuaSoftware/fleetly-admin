import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { CreateDriverForm } from "@/components/create-driver-form";

export default async function NewDriverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  const isGeneralAdmin = me?.role === "general_admin";

  // A dispatcher gets no picker at all — see CreateDriverForm's own
  // comment on why an empty list (not just a disabled field) is right.
  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={isGeneralAdmin} />
      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">New driver</h1>
          <p className="text-sm text-ink-3">Issue their badge once they&rsquo;re added.</p>
        </div>
        <CreateDriverForm subcontractors={subcontractors} />
      </div>
    </main>
  );
}
