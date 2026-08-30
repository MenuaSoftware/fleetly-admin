"use server";

import { apiFetch, getMe } from "@/lib/api";
import type {
  DriverSummary,
  StaffSummary,
  SubcontractorSummary,
  VehicleSummary,
} from "@/lib/types";

export type SearchKind = "driver" | "vehicle" | "subcontractor" | "staff";

export interface SearchRecord {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Lowercased haystack the client filters against. */
  match: string;
}

/**
 * Everything the command palette can jump to, fetched once when the
 * palette opens and filtered in the browser as the user types.
 *
 * One round trip per palette session rather than one per keystroke:
 * these collections are bounded (a subcontractor's roster is tens to
 * low hundreds of records), so shipping them once and filtering locally
 * is both faster to type against and cheaper on the API than debounced
 * server search would be.
 *
 * Trips are deliberately NOT indexed. That list is the one here that
 * grows without bound, and a trip is reachable in one more click from
 * the driver or vehicle it belongs to — both of which are indexed. If
 * trip search is ever wanted directly it needs a real server-side
 * search endpoint, not a bigger payload here.
 *
 * Every fetch is scoped by RLS exactly as the list screens are, so a
 * dispatcher's palette contains only their own subcontractor's records.
 * Each call degrades independently: a dead endpoint costs its own
 * section, not the whole palette.
 */
export async function loadSearchIndexAction(): Promise<SearchRecord[]> {
  const me = await getMe();
  const isGeneralAdmin = me?.role === "general_admin";

  const [drivers, vehicles, subcontractors, staff] = await Promise.all([
    apiFetch<DriverSummary[]>("/drivers").catch(() => []),
    apiFetch<VehicleSummary[]>("/vehicles").catch(() => []),
    apiFetch<SubcontractorSummary[]>("/subcontractors").catch(() => []),
    isGeneralAdmin
      ? apiFetch<StaffSummary[]>("/staff").catch(() => [])
      : Promise.resolve([] as StaffSummary[]),
  ]);

  const subcoName = new Map(subcontractors.map((s) => [s.id, s.name]));
  const records: SearchRecord[] = [];

  for (const d of drivers) {
    const name = `${d.firstName} ${d.lastName}`;
    const subco = subcoName.get(d.subcoId);
    records.push({
      kind: "driver",
      id: d.id,
      title: name,
      subtitle: isGeneralAdmin ? subco : undefined,
      href: `/drivers/${d.id}`,
      match: `${name} ${subco ?? ""} driver`.toLowerCase(),
    });
  }

  for (const v of vehicles) {
    const subco = subcoName.get(v.subcoId);
    records.push({
      kind: "vehicle",
      id: v.id,
      title: v.plate,
      subtitle: isGeneralAdmin ? `${v.bodyType} · ${subco ?? ""}` : v.bodyType,
      href: `/vehicles/${v.id}`,
      match: `${v.plate} ${v.bodyType} ${subco ?? ""} vehicle`.toLowerCase(),
    });
  }

  // A dispatcher can read exactly their own subcontractor here, so this
  // is not gated on the admin flag — it simply yields one row for them.
  for (const s of subcontractors) {
    records.push({
      kind: "subcontractor",
      id: s.id,
      title: s.name,
      subtitle: "Subcontractor",
      href: `/subcontractors/${s.id}`,
      match: `${s.name} subcontractor client`.toLowerCase(),
    });
  }

  for (const s of staff) {
    const name = `${s.firstName} ${s.lastName}`;
    records.push({
      kind: "staff",
      id: s.id,
      title: name,
      subtitle: s.role === "general_admin" ? "General admin" : "Dispatcher",
      href: `/staff/${s.id}`,
      match: `${name} ${s.role} staff`.toLowerCase(),
    });
  }

  return records;
}
