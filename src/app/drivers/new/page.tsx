import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { CreateDriverForm } from "@/components/create-driver-form";

export default async function NewDriverPage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  // A dispatcher gets no picker at all — see CreateDriverForm's own
  // comment on why an empty list (not just a disabled field) is right.
  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <div className="mx-auto w-full max-w-sm animate-slide-up px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/drivers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Drivers
      </Link>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">New driver</h1>
        <p className="text-sm text-ink-3">Issue their badge once they&rsquo;re added.</p>
      </div>
      <CreateDriverForm subcontractors={subcontractors} />
    </div>
  );
}
