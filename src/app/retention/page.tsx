import { redirect } from "next/navigation";
import { apiFetch, getMe } from "@/lib/api";
import { RetentionPolicySummary } from "@/lib/types";
import { RetentionPolicyManager } from "@/components/retention-policy-manager";

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
    <div className="mx-auto w-full max-w-2xl animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Retention</h1>
        <p className="text-sm text-ink-3">
          How long each type of personal data is kept before it&apos;s deleted or cleared.
        </p>
      </div>

      <RetentionPolicyManager policies={policies} />
    </div>
  );
}
