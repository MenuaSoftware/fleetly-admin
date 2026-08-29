import { redirect } from "next/navigation";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { SubcontractorManager } from "@/components/subcontractor-manager";

/**
 * "Manage subcontractors" (docs/product-brief.md §19) — general admin
 * only, same gate as /staff and /document-types. subcontractor_write/
 * _update RLS (is_general_admin() only) is the real enforcement;
 * this is the good-UX layer.
 */
export default async function SubcontractorsPage() {
  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors");

  return (
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Subcontractors</h1>
        <p className="text-sm text-ink-3">Every client this fleet is run on behalf of.</p>
      </div>

      <SubcontractorManager subcontractors={subcontractors} />
    </div>
  );
}
