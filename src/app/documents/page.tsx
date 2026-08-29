import { FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DocumentTypeSummary, DriverSummary, VehicleSummary } from "@/lib/types";
import { DocumentManager } from "@/components/document-manager";
import { PageHeader, PageShell } from "@/components/page-kit";

/**
 * "Upload driver or vehicle document | no | yes | yes" — dispatcher or
 * admin, no general-admin gate here (unlike /document-types, which
 * manages the *types* themselves, general-admin-only). document.
 * controller.ts's own StaffOnly()/RLS is the real enforcement; a
 * dispatcher's vehicles()/drivers() lists are already scoped to their
 * own subco by RLS, so nothing extra is needed here for that.
 */
export default async function DocumentsPage() {
  const [vehicles, drivers, documentTypes] = await Promise.all([
    apiFetch<VehicleSummary[]>("/vehicles"),
    apiFetch<DriverSummary[]>("/drivers"),
    apiFetch<DocumentTypeSummary[]>("/document-types"),
  ]);

  return (
    <PageShell width="medium">
      <PageHeader
        eyebrow="Compliance"
        title="Documents"
        description="Registration, insurance, licences — filed per vehicle or driver."
        icon={<FileText className="h-5 w-5" />}
      />

      <DocumentManager vehicles={vehicles} drivers={drivers} documentTypes={documentTypes} />
    </PageShell>
  );
}
