import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { StaffMe, SubcontractorSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { SubcontractorManager } from "@/components/subcontractor-manager";

/**
 * "Manage subcontractors" (docs/product-brief.md §19) — general admin
 * only, same gate as /staff and /document-types. subcontractor_write/
 * _update RLS (is_general_admin() only) is the real enforcement;
 * this is the good-UX layer.
 */
export default async function SubcontractorsPage() {
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
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Subcontractors</h1>
          <p className="text-sm text-ink-3">Every client this fleet is run on behalf of.</p>
        </div>

        <SubcontractorManager subcontractors={subcontractors} />
      </div>
    </main>
  );
}
