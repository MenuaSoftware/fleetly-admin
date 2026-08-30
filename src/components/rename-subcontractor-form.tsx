"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { renameSubcontractorAction } from "@/app/subcontractors/actions";
import { Button } from "@/components/ui/button";

/**
 * Inline rename for the subcontractor detail masthead. Deliberately not
 * SubcontractorManager: that component owns the whole list-plus-create
 * screen, and mounting it here to rename one record would pull in a
 * create form this page has no business showing.
 *
 * router.refresh() after a successful rename because the name is
 * rendered by the surrounding *server* page — revalidation alone
 * doesn't repaint an already-mounted route, the gotcha this codebase
 * hit before with document types.
 */
export function RenameSubcontractorForm({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setIsPending(true);
    setError(null);
    const result = await renameSubcontractorAction(id, trimmed);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil />
        Rename
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <label htmlFor="subco-name" className="sr-only">
        Subcontractor name
      </label>
      <input
        id="subco-name"
        value={value}
        autoFocus
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setEditing(false);
            setValue(name);
            setError(null);
          }
        }}
        className="min-w-0 flex-1 rounded-xl border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none disabled:opacity-60"
      />
      <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />}
        Save
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setEditing(false);
          setValue(name);
          setError(null);
        }}
      >
        <X />
      </Button>
      {error && <p className="w-full text-xs text-bad">{error}</p>}
    </div>
  );
}
