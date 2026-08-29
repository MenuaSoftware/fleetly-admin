import { UserPlus } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { CreateDriverForm } from "@/components/create-driver-form";
import { BackLink, PageHeader, PageShell, SectionCard } from "@/components/page-kit";

export default async function NewDriverPage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  // A dispatcher gets no picker at all — see CreateDriverForm's own
  // comment on why an empty list (not just a disabled field) is right.
  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <PageShell width="narrow">
      <BackLink href="/drivers">Drivers</BackLink>
      <PageHeader
        eyebrow="Roster"
        title="New driver"
        description="Issue their badge once they’re added."
        icon={<UserPlus className="h-5 w-5" />}
      />
      <SectionCard>
        <CreateDriverForm subcontractors={subcontractors} />
      </SectionCard>
    </PageShell>
  );
}
