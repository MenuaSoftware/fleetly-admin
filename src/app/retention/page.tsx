import { redirect } from "next/navigation";
import { Archive } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { RetentionPolicySummary } from "@/lib/types";
import { RetentionPolicyManager } from "@/components/retention-policy-manager";
import { PageHeader, PageShell } from "@/components/page-kit";

/**
 * "Configure retention settings" is general-admin-only per
 * product-brief.md §19 — same gate as staff/document-types. RLS
 * (retention_policy_write/_update, is_general_admin() only) and
 * retention.controller.ts's own @GeneralAdminOnly() are the real
 * enforcement; this is the good-UX layer.
 */
export default async function RetentionPage() {
  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const policies = await apiFetch<RetentionPolicySummary[]>("/retention");

  return (
    <PageShell width="medium">
      <PageHeader
        eyebrow="Administration"
        title="Retention"
        description="How long each type of personal data is kept before it’s deleted or cleared."
        icon={<Archive className="h-5 w-5" />}
      />

      <RetentionPolicyManager policies={policies} />
    </PageShell>
  );
}
