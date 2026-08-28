import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { RetentionPolicySummary, StaffMe } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { RetentionPolicyManager } from "@/components/retention-policy-manager";

/**
 * "Configure retention settings" is general-admin-only per
 * product-brief.md §19 — same gate as staff/document-types. RLS
 * (retention_policy_write/_update, is_general_admin() only) and
 * retention.controller.ts's own @GeneralAdminOnly() are the real
 * enforcement; this is the good-UX layer.
 */
export default async function RetentionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const policies = await apiFetch<RetentionPolicySummary[]>("/retention");

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Retention</h1>
          <p className="text-sm text-ink-3">
            How long each type of personal data is kept before it&apos;s deleted or cleared.
          </p>
        </div>

        <RetentionPolicyManager policies={policies} />
      </div>
    </main>
  );
}
