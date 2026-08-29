import { redirect } from "next/navigation";
import { Copy, FileStack, Plus } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { DocumentTypeSummary, SubcontractorSummary } from "@/lib/types";
import { CloneDocumentTypesButton } from "@/components/clone-document-types-button";
import { CreateDocumentTypeForm } from "@/components/create-document-type-form";
import { DocumentTypeList } from "@/components/document-type-list";
import { PageHeader, PageShell, SectionCard } from "@/components/page-kit";

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
    <PageShell width="medium">
      <PageHeader
        eyebrow="Administration"
        title="Document types"
        description="What drivers and vehicles need on file, and how early to warn before it expires."
        icon={<FileStack className="h-5 w-5" />}
      />

      <div className="flex flex-col gap-5">
        <SectionCard title="Configured types" icon={<FileStack className="h-4 w-4" />} flush>
          <DocumentTypeList types={types} subcoName={subcoName} />
        </SectionCard>

        <SectionCard title="Add a type" icon={<Plus className="h-4 w-4" />}>
          <CreateDocumentTypeForm subcontractors={subcontractors} />
        </SectionCard>

        <SectionCard
          title="Clone the defaults"
          description="Copy every global type onto one subcontractor"
          icon={<Copy className="h-4 w-4" />}
        >
          <CloneDocumentTypesButton subcontractors={subcontractors} />
        </SectionCard>
      </div>
    </PageShell>
  );
}
