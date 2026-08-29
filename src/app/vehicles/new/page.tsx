import { Truck } from "lucide-react";
import { apiFetch, getMe } from "@/lib/api";
import { SubcontractorSummary } from "@/lib/types";
import { CreateVehicleForm } from "@/components/create-vehicle-form";
import { BackLink, PageHeader, PageShell, SectionCard } from "@/components/page-kit";

export default async function NewVehiclePage() {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const subcontractors = isGeneralAdmin
    ? await apiFetch<SubcontractorSummary[]>("/subcontractors")
    : [];

  return (
    <PageShell width="narrow">
      <BackLink href="/vehicles">Vehicles</BackLink>
      <PageHeader
        eyebrow="Fleet"
        title="New vehicle"
        description="Add it to the fleet."
        icon={<Truck className="h-5 w-5" />}
      />
      <SectionCard>
        <CreateVehicleForm subcontractors={subcontractors} />
      </SectionCard>
    </PageShell>
  );
}
