"use client";

import { useState } from "react";
import { createSubcontractorAction, renameSubcontractorAction } from "@/app/subcontractors/actions";
import { SubcontractorSummary } from "@/lib/types";

/**
 * One component owning both the list and the create form together —
 * same reasoning as trip-share-manager.tsx/retention-policy-manager.tsx:
 * a fresh subcontractor's name is already known locally from the form's
 * own input, no refetch needed to render it, and this sidesteps the
 * staleness bug document-type-list.tsx's own history describes for a
 * list split from a sibling create form.
 */
export function SubcontractorManager({ subcontractors: initial }: { subcontractors: SubcontractorSummary[] }) {
  const [subcontractors, setSubcontractors] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function startEdit(s: SubcontractorSummary) {
    setEditingId(s.id);
    setEditName(s.name);
    setRowErrors((e) => ({ ...e, [s.id]: "" }));
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return;
    setBusyId(id);
    const result = await renameSubcontractorAction(id, editName.trim());
    setBusyId(null);
    if (result.error) {
      setRowErrors((e) => ({ ...e, [id]: result.error! }));
      return;
    }
    setSubcontractors((list) => list.map((s) => (s.id === id ? result.subcontractor! : s)));
    setEditingId(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    const result = await createSubcontractorAction(newName.trim());
    setIsCreating(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setSubcontractors((list) =>
      [...list, result.subcontractor!].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNewName("");
  }

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
        {subcontractors.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-3">No subcontractors yet.</p>
        ) : (
          <ul>
            {subcontractors.map((s, i) => (
              <li
                key={s.id}
                data-testid={`subcontractor-${s.id}`}
                className={`px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                {editingId === s.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={busyId === s.id}
                      className="min-w-[12rem] flex-1 rounded-lg border border-line-2 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none disabled:bg-wash"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(s.id)}
                      disabled={busyId === s.id}
                      className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={busyId === s.id}
                      className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-wash disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="shrink-0 rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash"
                    >
                      Rename
                    </button>
                  </div>
                )}
                {rowErrors[s.id] && (
                  <p role="alert" className="mt-1.5 text-xs text-bad">
                    {rowErrors[s.id]}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-paper p-4">
        <p className="mb-2 text-sm font-semibold text-ink">New subcontractor</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={isCreating}
            placeholder="Company name"
            className="flex-1 rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-wash"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {isCreating ? "Adding…" : "Add"}
          </button>
        </div>
        {createError && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {createError}
          </p>
        )}
      </div>
    </div>
  );
}
