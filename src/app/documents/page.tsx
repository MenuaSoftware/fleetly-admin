import { createClient } from "@/lib/supabase/server";
import { apiFetch } from "@/lib/api";
import { DocumentTypeSummary, DriverSummary, StaffMe, VehicleSummary } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { DocumentManager } from "@/components/document-manager";

/**
 * "Upload driver or vehicle document | no | yes | yes" — dispatcher or
 * admin, no general-admin gate here (unlike /document-types, which
 * manages the *types* themselves, general-admin-only). document.
 * controller.ts's own StaffOnly()/RLS is the real enforcement; a
 * dispatcher's vehicles()/drivers() lists are already scoped to their
 * own subco by RLS, so nothing extra is needed here for that.
 */
export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const me = await apiFetch<StaffMe>("/auth/me").catch(() => null);

  const [vehicles, drivers, documentTypes] = await Promise.all([
    apiFetch<VehicleSummary[]>("/vehicles"),
    apiFetch<DriverSummary[]>("/drivers"),
    apiFetch<DocumentTypeSummary[]>("/document-types"),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader email={user?.email} isGeneralAdmin={me?.role === "general_admin"} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-ink">Documents</h1>
          <p className="text-sm text-ink-3">Registration, insurance, licences — filed per vehicle or driver.</p>
        </div>

        <DocumentManager vehicles={vehicles} drivers={drivers} documentTypes={documentTypes} />
      </div>
    </main>
  );
}
