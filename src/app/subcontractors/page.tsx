import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { SubcontractorManager } from "@/components/subcontractor-manager";
import { PageHeader, PageShell } from "@/components/page-kit";

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
    <PageShell width="medium">
      <PageHeader
        eyebrow="Administration"
        title="Subcontractors"
        description="Every client this fleet is run on behalf of."
        icon={<Building2 className="h-5 w-5" />}
      />

      <SubcontractorManager subcontractors={subcontractors} />
    </PageShell>
  );
}
