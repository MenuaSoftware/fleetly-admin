import { redirect } from "next/navigation";
import { apiFetch, getMe } from "@/lib/api";
import { DocumentTypeSummary, SubcontractorSummary } from "@/lib/types";
import { CloneDocumentTypesButton } from "@/components/clone-document-types-button";
import { CreateDocumentTypeForm } from "@/components/create-document-type-form";
import { DocumentTypeList } from "@/components/document-type-list";

/**
 * "Manage document types | no | no | yes" — general admin only, per
 * the roles matrix document-type.controller.ts's own comment cites.
 * Same "RLS is the real enforcement, this is the good-UX layer" split
 * as every other general-admin-gated page here.
 */
export default async function DocumentTypesPage() {
  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const [types, subcontractors] = await Promise.all([
    apiFetch<DocumentTypeSummary[]>("/document-types"),
    apiFetch<SubcontractorSummary[]>("/subcontractors"),
  ]);
  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));

  return (
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Document types</h1>
        <p className="text-sm text-ink-3">
          What drivers and vehicles need on file, and how early to warn before it expires.
        </p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        <DocumentTypeList types={types} subcoName={subcoName} />
      </div>

      <div className="mb-6">
        <CreateDocumentTypeForm subcontractors={subcontractors} />
      </div>

      <CloneDocumentTypesButton subcontractors={subcontractors} />
    </div>
  );
}
