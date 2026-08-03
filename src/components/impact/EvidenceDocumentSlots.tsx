"use client";

import { ChangeEvent, useEffect, useState } from "react";

export type EvidenceDocumentRole =
  | "line_report"
  | "optional_evidence";

export type EvidenceSelectedDocument = {
  id: string;
  role: EvidenceDocumentRole;
  description: string;
  file: File | null;
  isRequired: boolean;
};

type EvidenceDocumentSlotsProps = {
  onDocumentsChange: (
    documents: EvidenceSelectedDocument[]
  ) => void;
};

const MAX_DOCUMENTS = 20;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const acceptedExtensions = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".csv",
  ".xls",
  ".xlsx",
  ".doc",
  ".docx",
  ".zip",
];

function createOptionalDocument(
  position: number
): EvidenceSelectedDocument {
  return {
    id: crypto.randomUUID(),
    role: "optional_evidence",
    description: `Evidencia adicional ${position}`,
    file: null,
    isRequired: false,
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string) {
  const extensionPosition = fileName.lastIndexOf(".");

  if (extensionPosition < 0) return "";

  return fileName.slice(extensionPosition).toLowerCase();
}

function validateFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!acceptedExtensions.includes(extension)) {
    return "Formato no permitido.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "El archivo supera el límite de 20 MB.";
  }

  return null;
}

export function EvidenceDocumentSlots({
  onDocumentsChange,
}: EvidenceDocumentSlotsProps) {
  const [principalDocument, setPrincipalDocument] =
    useState<EvidenceSelectedDocument>({
      id: "principal-line-report",
      role: "line_report",
      description: "Informe principal del impacto",
      file: null,
      isRequired: true,
    });

  const [optionalDocuments, setOptionalDocuments] = useState<
    EvidenceSelectedDocument[]
  >([]);

  const [fileErrors, setFileErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    onDocumentsChange([
      principalDocument,
      ...optionalDocuments,
    ]);
  }, [
    principalDocument,
    optionalDocuments,
    onDocumentsChange,
  ]);

  function handlePrincipalFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPrincipalDocument((current) => ({
        ...current,
        file: null,
      }));
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setFileErrors((current) => ({
        ...current,
        [principalDocument.id]: validationError,
      }));

      event.target.value = "";
      return;
    }

    setFileErrors((current) => {
      const updated = { ...current };
      delete updated[principalDocument.id];
      return updated;
    });

    setPrincipalDocument((current) => ({
      ...current,
      file,
    }));
  }

  function addOptionalDocument() {
    const totalDocuments =
      1 + optionalDocuments.length;

    if (totalDocuments >= MAX_DOCUMENTS) return;

    setOptionalDocuments((current) => [
      ...current,
      createOptionalDocument(current.length + 1),
    ]);
  }

  function updateOptionalDescription(
    documentId: string,
    description: string
  ) {
    setOptionalDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              description,
            }
          : document
      )
    );
  }

  function handleOptionalFile(
    documentId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setOptionalDocuments((current) =>
        current.map((document) =>
          document.id === documentId
            ? {
                ...document,
                file: null,
              }
            : document
        )
      );
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setFileErrors((current) => ({
        ...current,
        [documentId]: validationError,
      }));

      event.target.value = "";
      return;
    }

    setFileErrors((current) => {
      const updated = { ...current };
      delete updated[documentId];
      return updated;
    });

    setOptionalDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              file,
            }
          : document
      )
    );
  }

  function removeOptionalDocument(documentId: string) {
    setOptionalDocuments((current) =>
      current.filter(
        (document) => document.id !== documentId
      )
    );

    setFileErrors((current) => {
      const updated = { ...current };
      delete updated[documentId];
      return updated;
    });
  }

  const totalDocuments =
    1 + optionalDocuments.length;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950">
            Documentos de evidencia
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Cargue el informe principal y añada tantos
            documentos de respaldo como necesite.
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {totalDocuments}/{MAX_DOCUMENTS} slots
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Informe principal
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Documento obligatorio que sustenta el impacto
              reportado.
            </p>
          </div>

          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            Obligatorio
          </span>
        </div>

        <input
          type="file"
          accept={acceptedExtensions.join(",")}
          onChange={handlePrincipalFile}
          className="mt-4 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
        />

        {principalDocument.file ? (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p className="font-semibold">
              {principalDocument.file.name}
            </p>

            <p className="mt-0.5 text-xs text-emerald-700">
              {principalDocument.file.type || "Tipo no identificado"}
              {" · "}
              {formatFileSize(
                principalDocument.file.size
              )}
            </p>
          </div>
        ) : null}

        {fileErrors[principalDocument.id] ? (
          <p className="mt-2 text-xs text-red-600">
            {fileErrors[principalDocument.id]}
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {optionalDocuments.map(
          (document, index) => (
            <div
              key={document.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Evidencia adicional {index + 1}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Documento opcional de respaldo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeOptionalDocument(document.id)
                  }
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Descripción del documento
                <input
                  type="text"
                  value={document.description}
                  onChange={(event) =>
                    updateOptionalDescription(
                      document.id,
                      event.target.value
                    )
                  }
                  placeholder="Ej. Registro de pesaje"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <input
                type="file"
                accept={acceptedExtensions.join(",")}
                onChange={(event) =>
                  handleOptionalFile(
                    document.id,
                    event
                  )
                }
                className="mt-4 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-300"
              />

              {document.file ? (
                <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
                  <p className="font-semibold">
                    {document.file.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {document.file.type ||
                      "Tipo no identificado"}
                    {" · "}
                    {formatFileSize(
                      document.file.size
                    )}
                  </p>
                </div>
              ) : null}

              {fileErrors[document.id] ? (
                <p className="mt-2 text-xs text-red-600">
                  {fileErrors[document.id]}
                </p>
              ) : null}
            </div>
          )
        )}
      </div>

      <button
        type="button"
        onClick={addOptionalDocument}
        disabled={totalDocuments >= MAX_DOCUMENTS}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-400 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Añadir otro documento
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Formatos permitidos: PDF, imágenes, CSV, Excel,
        Word y ZIP. Tamaño máximo: 20 MB por archivo.
      </p>
    </section>
  );
}
