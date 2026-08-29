"use client";

import { useRef, useState } from "react";
import {
  confirmDocumentAction,
  createDocumentIntentAction,
  deleteDocumentAction,
  getDocumentViewUrlAction,
  listDocumentsAction,
} from "@/app/documents/actions";
import { DocumentSummary, DocumentTypeSummary, DriverSummary, VehicleSummary } from "@/lib/types";

const STATUS_LABEL: Record<DocumentSummary["status"], string> = {
  valid: "Valid",
  expiring_soon: "Expiring soon",
  expired: "Expired",
};

const STATUS_BADGE_CLASS: Record<DocumentSummary["status"], string> = {
  valid: "bg-ok-bg text-ok",
  expiring_soon: "bg-warn-bg text-warn",
  expired: "bg-bad-bg text-bad",
};

async function sha256Hex(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * "Both uploaded by the dispatcher and read-only to the driver" —
 * document.controller.ts's own comment — so this whole screen is
 * dispatcher/admin-facing; the mobile app only ever reads.
 *
 * One component owns the entity picker, the fetched document list, and
 * the upload form together, same reasoning as trip-share-manager.tsx
 * and retention-policy-manager.tsx: splitting the list from a sibling
 * upload form risks the exact staleness bug document-type-list.tsx hit
 * earlier — a freshly uploaded document's real type name/expiry are
 * already known locally (from the type picker and the form's own
 * input), so there's no need to refetch to render it.
 *
 * The signed-URL PUT itself happens straight from this browser to
 * Supabase Storage, not through the NestJS API or a Server Action —
 * same reasoning as every other signed-upload flow in this codebase
 * (fleetly-mobile's photo-upload.ts, most recently), the signed URL is
 * exactly for bypassing that.
 */
export function DocumentManager({
  vehicles,
  drivers,
  documentTypes,
}: {
  vehicles: VehicleSummary[];
  drivers: DriverSummary[];
  documentTypes: DocumentTypeSummary[];
}) {
  const [entityKind, setEntityKind] = useState<"vehicle" | "driver">("vehicle");
  const [entityId, setEntityId] = useState("");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const [typeId, setTypeId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const entities = entityKind === "vehicle" ? vehicles : drivers;
  const selectedEntity = entities.find((e) => e.id === entityId);
  const availableTypes = documentTypes.filter(
    (t) => t.attachedTo === entityKind && (t.subcoId === null || t.subcoId === selectedEntity?.subcoId),
  );

  // Triggered directly from the picker's onChange, not a useEffect
  // watching entityId — this is a direct response to one user action
  // (selecting an entity), the same event-handler-triggered-fetch
  // pattern every other async action in this codebase already uses
  // (handleGrant, handleClone, handleSave, ...), not something that
  // needs to stay synchronized on every render.
  async function loadDocuments(kind: "vehicle" | "driver", id: string) {
    if (!id) return;
    setIsLoadingDocs(true);
    setListError(null);
    const query = kind === "vehicle" ? { vehicleId: id } : { driverId: id };
    const result = await listDocumentsAction(query);
    setIsLoadingDocs(false);
    if (result.error) {
      setListError(result.error);
      return;
    }
    setDocuments(result.documents ?? []);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !typeId || !expiryDate || !entityId) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      setUploadStage("Preparing upload…");
      const checksum = await sha256Hex(file);
      const intentResult = await createDocumentIntentAction({
        typeId,
        ...(entityKind === "vehicle" ? { vehicleId: entityId } : { driverId: entityId }),
        expiryDate,
        mimeType: file.type,
        byteSize: file.size,
        checksum,
        originalFilename: file.name,
      });
      if (intentResult.error || !intentResult.intent) {
        setUploadError(intentResult.error ?? "Could not prepare this upload.");
        return;
      }
      const { intent } = intentResult;

      setUploadStage("Uploading…");
      const uploadRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        setUploadError(`Could not upload the file (${uploadRes.status}).`);
        return;
      }

      setUploadStage("Confirming…");
      const confirmResult = await confirmDocumentAction(intent.documentId);
      if (confirmResult.error || !confirmResult.document) {
        setUploadError(confirmResult.error ?? "Could not confirm this upload.");
        return;
      }

      setDocuments((list) => [confirmResult.document!, ...list]);
      setTypeId("");
      setExpiryDate("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
      setUploadStage(null);
    }
  }

  async function handleView(id: string) {
    setRowErrors((e) => ({ ...e, [id]: "" }));
    const result = await getDocumentViewUrlAction(id);
    if (result.error) {
      setRowErrors((e) => ({ ...e, [id]: result.error! }));
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    const result = await deleteDocumentAction(id);
    setBusyId(null);
    if (result.error) {
      setRowErrors((e) => ({ ...e, [id]: result.error! }));
      return;
    }
    setDocuments((list) => list.filter((d) => d.id !== id));
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["vehicle", "driver"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setEntityKind(kind);
              setEntityId("");
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium capitalize transition-colors ${
              entityKind === kind
                ? "border-brand bg-brand-soft text-brand-strong"
                : "border-line-2 text-ink-2 hover:bg-wash"
            }`}
          >
            {kind}s
          </button>
        ))}
      </div>

      <select
        id="documentEntityId"
        value={entityId}
        onChange={(e) => {
          const id = e.target.value;
          setEntityId(id);
          setDocuments([]);
          loadDocuments(entityKind, id);
        }}
        className="mb-6 w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        <option value="">{`Select a ${entityKind}…`}</option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {entityKind === "vehicle" ? (e as VehicleSummary).plate : `${(e as DriverSummary).firstName} ${(e as DriverSummary).lastName}`}
          </option>
        ))}
      </select>

      {entityId && (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-paper">
            {isLoadingDocs ? (
              <p className="px-5 py-8 text-center text-sm text-ink-3">Loading…</p>
            ) : listError ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-bad">
                {listError}
              </p>
            ) : documents.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-3">No documents on file yet.</p>
            ) : (
              <ul>
                {documents.map((d, i) => (
                  <li
                    key={d.id}
                    data-testid={`document-${d.id}`}
                    className={`px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{d.typeName}</p>
                        <p className="text-xs text-ink-3">
                          expires {d.expiryDate}
                          {d.uploadStatus === "pending" ? " · upload pending" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 font-mono text-xs ${STATUS_BADGE_CLASS[d.status]}`}>
                          {STATUS_LABEL[d.status]}
                        </span>
                        {d.uploadStatus === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleView(d.id)}
                            className="rounded-lg border border-line-2 px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-wash"
                          >
                            View
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          disabled={busyId === d.id}
                          className="rounded-lg border border-bad/30 px-2.5 py-1.5 text-xs font-medium text-bad transition-colors hover:bg-bad-bg disabled:opacity-60"
                        >
                          {busyId === d.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    {rowErrors[d.id] && (
                      <p role="alert" className="mt-1.5 text-xs text-bad">
                        {rowErrors[d.id]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Upload a document</p>

            <select
              id="documentTypeId"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              disabled={isUploading}
              className="mb-3 w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
            >
              <option value="">Select a document type…</option>
              {availableTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <label htmlFor="documentExpiryDate" className="mb-1.5 block text-xs font-medium text-ink-2">
              Expiry date
            </label>
            <input
              id="documentExpiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isUploading}
              className="mb-3 w-full rounded-lg border border-line-2 bg-paper px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-wash"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={isUploading}
              className="mb-3 w-full text-sm text-ink-2"
            />

            {uploadError && (
              <p role="alert" className="mb-3 text-sm text-bad">
                {uploadError}
              </p>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !typeId || !expiryDate}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              {isUploading ? (uploadStage ?? "Uploading…") : "Upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
