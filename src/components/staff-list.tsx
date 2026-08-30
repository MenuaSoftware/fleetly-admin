"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, UserCog } from "lucide-react";
import type { StaffSummary } from "@/lib/types";
import { EmptyState, StatusPill } from "@/components/page-kit";
import { EntityCard, EntityGrid, InitialsAvatar } from "@/components/entity-grid";
import { StaffStatusToggle } from "@/components/staff-status-toggle";
import {
  CollectionFilters,
  CollectionPager,
  CollectionSearch,
  CollectionSort,
  CollectionToolbar,
  useCollection,
  type SortOption,
} from "@/components/collection";

export interface StaffRow extends StaffSummary {
  subcoName?: string;
}

const SORTS: SortOption<StaffRow>[] = [
  { id: "name", label: "Name (A–Z)", compare: (a, b) => a.lastName.localeCompare(b.lastName) },
  { id: "role", label: "Role", compare: (a, b) => a.role.localeCompare(b.role) },
  { id: "status", label: "Status", compare: (a, b) => a.status.localeCompare(b.status) },
];

export function StaffList({ staff, selfId }: { staff: StaffRow[]; selfId?: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const searchFields = useCallback(
    (s: StaffRow) => [s.firstName, s.lastName, `${s.firstName} ${s.lastName}`, s.subcoName, s.role],
    [],
  );
  const filterFn = useCallback((s: StaffRow, id: string) => {
    if (id === "admin") return s.role === "general_admin";
    if (id === "dispatcher") return s.role === "dispatcher";
    if (id === "inactive") return s.status !== "active";
    return true;
  }, []);

  const c = useCollection({
    items: staff,
    search,
    searchFields,
    sorts: SORTS,
    filters: filter,
    filterFn,
  });

  if (staff.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-paper shadow-sm">
        <EmptyState
          icon={<UserCog className="h-5 w-5" />}
          title="No staff yet"
          description="Invite the first dispatcher so someone other than you can run the panel."
          action={
            <Link
              href="/staff/invite"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
            >
              <Plus className="h-4 w-4" />
              Invite staff
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <CollectionToolbar>
        <CollectionSearch value={search} onChange={setSearch} placeholder="Search staff…" />
        <CollectionFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All", count: staff.length },
            {
              id: "admin",
              label: "Admins",
              count: staff.filter((s) => s.role === "general_admin").length,
            },
            {
              id: "dispatcher",
              label: "Dispatchers",
              count: staff.filter((s) => s.role === "dispatcher").length,
            },
            {
              id: "inactive",
              label: "Inactive",
              count: staff.filter((s) => s.status !== "active").length,
            },
          ]}
        />
        <CollectionSort sorts={SORTS} value={c.sortId} onChange={c.setSortId} />
      </CollectionToolbar>

      {c.items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-paper shadow-sm">
          <EmptyState
            icon={<UserCog className="h-5 w-5" />}
            title="No staff match"
            description="Try a different search or clear the filter."
          />
        </div>
      ) : (
        <EntityGrid>
          {c.items.map((s, i) => {
            const name = `${s.firstName} ${s.lastName}`;
            const isSelf = s.id === selfId;
            return (
              <EntityCard
                key={s.id}
                index={i}
                href={`/staff/${s.id}`}
                avatar={<InitialsAvatar name={name} tone={s.role === "general_admin" ? "viz-2" : "info"} />}
                title={isSelf ? `${name} (you)` : name}
                subtitle={s.subcoId ? (s.subcoName ?? "Unknown subcontractor") : "All subcontractors"}
                dimmed={s.status !== "active"}
                meta={
                  <StatusPill tone={s.role === "general_admin" ? "viz-2" : "info"}>
                    {s.role === "general_admin" && <ShieldCheck className="h-3 w-3" />}
                    {s.role === "general_admin" ? "General admin" : "Dispatcher"}
                  </StatusPill>
                }
                actions={<StaffStatusToggle staffId={s.id} status={s.status} isSelf={isSelf} />}
              />
            );
          })}
        </EntityGrid>
      )}

      <CollectionPager
        page={c.page}
        pageCount={c.pageCount}
        matched={c.matched}
        total={c.total}
        pageSize={c.pageSize}
        onPage={c.setPage}
        noun="staff"
      />
    </>
  );
}
