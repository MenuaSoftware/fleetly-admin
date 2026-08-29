import { redirect } from "next/navigation";
import { MailPlus } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { InviteForm } from "@/components/invite-form";
import { BackLink, PageHeader, PageShell, SectionCard } from "@/components/page-kit";

export default async function InviteStaffPage() {
  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors");

  return (
    <PageShell width="narrow">
      <BackLink href="/staff">Staff</BackLink>
      <PageHeader
        eyebrow="Administration"
        title="Invite staff"
        description="They’ll get an email to set their own password."
        icon={<MailPlus className="h-5 w-5" />}
      />
      <SectionCard>
        <InviteForm subcontractors={subcontractors} />
      </SectionCard>
    </PageShell>
  );
}
