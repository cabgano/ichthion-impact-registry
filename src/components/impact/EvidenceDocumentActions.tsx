type EvidenceDocumentActionsProps = {
  fileId: string;
  fileName: string;
};

export function EvidenceDocumentActions({
  fileId,
  fileName,
}: EvidenceDocumentActionsProps) {
  const encodedFileId =
    encodeURIComponent(
      fileId
    );

  const accessPath =
    `/api/impact/evidence/files/${encodedFileId}`;

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={`${accessPath}?mode=open`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          aria-label={`Open ${fileName}`}
        >
          Open document
        </a>

        <a
          href={`${accessPath}?mode=download`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          aria-label={`Download ${fileName}`}
        >
          Download
        </a>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        El acceso se autoriza al momento del clic mediante una URL temporal.
      </p>
    </div>
  );
}