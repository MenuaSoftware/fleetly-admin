import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ShieldCheck, UserCog } from "lucide-react";
import { apiFetch, ApiError, getMe } from "@/lib/api";
import type { StaffSummary, SubcontractorSummary } from "@/lib/types";
import { BackLink, PageShell, SectionCard, StatusPill } from "@/components/page-kit";
import { InitialsAvatar } from "@/components/entity-grid";
import { DetailMasthead } from "@/components/detail-kit";
import { StaffStatusToggle } from "@/components/staff-status-toggle";

/**
 * One staff member.
 *
 * Deliberately the thinnest detail page here, because a staff record
 * genuinely is thin: identity, role, subcontractor, status. There is no
 * per-staff activity feed to show — this product's audit trail exists
 * (audit_event) but is not exposed through any endpoint, and inventing
 * a plausible-looking activity list would be worse than showing none.
 * What this page does add over the list row is the *consequences* of
 * the role and status, spelled out rather than left implicit in a pill.
 */
export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getMe();
  if (me?.role !== "general_admin") {
    redirect("/");
  }

  const staff = await apiFetch<StaffSummary>(`/staff/${id}`).catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
  if (!staff) notFound();

  const subcontractors = await apiFetch<SubcontractorSummary[]>("/subcontractors").catch(() => []);
  const subcoName = subcontractors.find((s) => s.id === staff.subcoId)?.name;

  const name = `${staff.firstName} ${staff.lastName}`;
  const isSelf = staff.id === me?.staffUserId;
  const isAdmin = staff.role === "general_admin";

  return (
    <PageShell width="medium">
      <BackLink href="/staff">Staff</BackLink>

      <DetailMasthead
        avatar={<InitialsAvatar name={name} tone={isAdmin ? "viz-2" : "info"} />}
        title={isSelf ? `${name} (you)` : name}
        subtitle={staff.subcoId ? (subcoName ?? "Unknown subcontractor") : "All subcontractors"}
        status={
          <StatusPill tone={isAdmin ? "viz-2" : "info"}>
            {isAdmin && <ShieldCheck className="h-3 w-3" />}
            {isAdmin ? "General admin" : "Dispatcher"}
          </StatusPill>
        }
        actions={<StaffStatusToggle staffId={staff.id} status={staff.status} isSelf={isSelf} />}
      />

      <div className="flex flex-col gap-5">
        <SectionCard title="Access" icon={<ShieldCheck className="h-4 w-4" />}>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-ink-3">Role</dt>
              <dd className="font-medium text-ink">{isAdmin ? "General admin" : "Dispatcher"}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
              <dt className="text-ink-3">Scope</dt>
              <dd className="text-right font-medium text-ink">
                {staff.subcoId ? (
                  <Link
                    href={`/subcontractors/${staff.subcoId}`}
                    className="text-brand transition-colors hover:text-brand-strong"
                  >
                    {subcoName ?? "Unknown subcontractor"}
                  </Link>
                ) : (
                  "Every subcontractor"
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
              <dt className="text-ink-3">Can sign in</dt>
              <dd className="font-medium text-ink">{staff.status === "active" ? "Yes" : "No"}</dd>
            </div>
          </dl>

          <p className="mt-4 border-t border-line pt-4 text-sm text-ink-2">
            {isAdmin
              ? "General admins manage subcontractors, staff, document types and retention, and see every subcontractor's drivers, vehicles and trips."
              : "Dispatchers work within their own subcontractor: drivers, vehicles, trips, documents, incidents and device approvals. Administration screens are not available to them."}
          </p>
        </SectionCard>

        <SectionCard title="Status" icon={<UserCog className="h-4 w-4" />}>
          <p className="text-sm text-ink-2">
            {staff.status === "active" ? (
              <>
                This account is active and can sign in to the panel. Deactivating it rejects their
                login immediately — existing sessions are not honoured once status leaves{" "}
                <span className="font-mono text-xs">active</span>.
              </>
            ) : (
              <>
                This account is deactivated and cannot sign in. Their record and everything they
                created stay intact; reactivating restores access.
              </>
            )}
          </p>
          {isSelf && (
            <p className="mt-3 rounded-xl border border-warn/25 bg-warn-bg px-3.5 py-2.5 text-xs text-warn">
              This is your own account. A general admin can&rsquo;t change their own status — that
              guard is what makes it impossible to lock every admin out of the panel.
            </p>
          )}
        </SectionCard>

        {staff.subcoId && (
          <SectionCard title="Subcontractor" icon={<Building2 className="h-4 w-4" />}>
            <Link
              href={`/subcontractors/${staff.subcoId}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-sunken"
            >
              <span className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-ink-3 transition-colors group-hover:text-brand" />
                <span className="text-sm font-medium text-ink">
                  {subcoName ?? "Unknown subcontractor"}
                </span>
              </span>
              <span className="text-xs text-ink-3">View</span>
            </Link>
          </SectionCard>
        )}
      </div>
    </PageShell>
  );
}
