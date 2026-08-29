import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { InviteForm } from "@/components/invite-form";

export default async function InviteStaffPage() {
  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors");

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/staff"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Staff
      </Link>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">Invite staff</h1>
        <p className="text-sm text-ink-3">
          They&rsquo;ll get an email to set their own password.
        </p>
      </div>
      <InviteForm subcontractors={subcontractors} />
    </div>
  );
}
