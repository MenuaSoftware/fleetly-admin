"use client";

import { useState } from "react";
import { deleteDocumentTypeAction, updateDocumentTypeAction } from "@/app/document-types/actions";
import { DocumentTypeSummary } from "@/lib/types";

/**
 * Owns its own list state so edits/deletes update in place — same
 * pattern as pending-devices-list.tsx and damage-list.tsx. Plain async
 * handlers, not useTransition (see vehicle-status-toggle.tsx's own
 * history for why that pattern is avoided here).
 *
 * Unlike those two, this list also needs to pick up creations from a
 * *sibling* component (create-document-type-form.tsx), which calls
 * router.refresh() rather than owning this list's state directly. That
 * refetches the parent Server Component's data and passes a new
 * `types` prop down — but useState(initial) only reads its argument on
 * the very first render, so without resyncing, the list would stay
 * stale forever after the very first render (confirmed live: a newly
 * created type existed for real, immediately, server-side, but never
 * appeared in the list until a manual page reload). "Adjust state
 * during render when a prop changes" (React's own documented pattern
 * for exactly this — react.dev/learn/you-might-not-need-an-effect) is
 * used instead of an effect, which react-hooks/set-state-in-effect
 * (React Compiler's linting) flags. Only fires when `initial`'s
 * reference actually changes — i.e. when the parent genuinely
 * re-fetched — so it doesn't clobber this list's own in-progress local
 * edits/deletes, which never touch that prop.
 */
export function DocumentTypeList({
  types: initial,
  subcoName,
}: {
  types: DocumentTypeSummary[];
  subcoName: Map<string, string>;
}) {
  const [types, setTypes] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setTypes(initial);
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editName, setEditName] = useState("");
  const [editDays, setEditDays] = useState("");

  function startEdit(type: DocumentTypeSummary) {
    setEditingId(type.id);
    setEditName(type.name);
    setEditDays(String(type.alertWindowDays));
    setErrors((e) => ({ ...e, [type.id]: "" }));
  }

  async function handleSave(id: string) {
    const alertWindowDays = Number(editDays);
    if (!editName.trim() || !Number.isFinite(alertWindowDays) || alertWindowDays < 1) return;
    setBusyId(id);
    const result = await updateDocumentTypeAction(id, { name: editName.trim(), alertWindowDays });
    setBusyId(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
      return;
    }
    setTypes((list) =>
      list.map((t) => (t.id === id ? { ...t, name: editName.trim(), alertWindowDays } : t)),
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    const result = await deleteDocumentTypeAction(id);
    setBusyId(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
      return;
    }
    setTypes((list) => list.filter((t) => t.id !== id));
  }

  if (types.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-ink-3">No document types yet.</p>;
  }

  return (
    <ul>
      {types.map((t, i) => (
        <li
          key={t.id}
          data-testid={`document-type-${t.id}`}
          className={`px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
        >
          {editingId === t.id ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={busyId === t.id}
                className="min-w-[10rem] flex-1 rounded-lg border border-line-2 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none disabled:bg-wash"
              />
              <input
                type="number"
                min={1}
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
                disabled={busyId === t.id}
                className="w-20 rounded-lg border border-line-2 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none disabled:bg-wash"
              />
              <span className="text-xs text-ink-3">days</span>
              <button
                type="button"
                onClick={() => handleSave(t.id)}
                disabled={busyId === t.id}
                className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                disabled={busyId === t.id}
                className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-wash disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{t.name}</p>
                <p className="text-xs text-ink-3">
                  {t.attachedTo} · alerts {t.alertWindowDays}d before expiry ·{" "}
                  {t.subcoId ? (subcoName.get(t.subcoId) ?? "Unknown subcontractor") : "Global default"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  disabled={busyId === t.id}
                  className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  disabled={busyId === t.id}
                  className="rounded-lg border border-bad/30 px-2.5 py-1.5 text-xs font-medium text-bad transition-colors hover:bg-bad-bg disabled:opacity-60"
                >
                  {busyId === t.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          )}
          {errors[t.id] && (
            <p role="alert" className="mt-1.5 text-xs text-bad">
              {errors[t.id]}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
