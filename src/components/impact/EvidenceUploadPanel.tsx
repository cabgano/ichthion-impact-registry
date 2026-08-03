"use client";

import { useState } from "react";

import {
  uploadEvidencePackage,
  type EvidencePackageUploadInput,
  type EvidencePackageUploadResult,
  type EvidenceUploadProgress,
} from "@/lib/impact/evidence-upload";

type EvidenceUploadPanelProps = {
  input: Omit<
    EvidencePackageUploadInput,
    "onProgress"
  >;
  onUploadingChange?: (
    isUploading: boolean
  ) => void;
  onCompleted?: (
    result: EvidencePackageUploadResult
  ) => void;
  onCreateAnother?: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error desconocido durante la carga.";
}

function getStageLabel(
  stage: EvidenceUploadProgress["stage"]
) {
  switch (stage) {
    case "uploading":
      return "Cargando documentos";

    case "registering":
      return "Registrando paquete";

    case "rollback":
      return "Revirtiendo carga incompleta";

    case "completed":
      return "Carga completada";

    default:
      return "Procesando";
  }
}

export function EvidenceUploadPanel({
  input,
  onUploadingChange,
  onCompleted,
  onCreateAnother,
}: EvidenceUploadPanelProps) {
  const [isUploading, setIsUploading] =
    useState(false);

  const [progress, setProgress] =
    useState<EvidenceUploadProgress | null>(
      null
    );

  const [result, setResult] =
    useState<EvidencePackageUploadResult | null>(
      null
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function handleUpload() {
    if (isUploading || result) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setProgress(null);
    onUploadingChange?.(true);

    try {
      const uploadResult =
        await uploadEvidencePackage({
          ...input,
          onProgress:
            setProgress,
        });

      setResult(uploadResult);
      onCompleted?.(uploadResult);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  const progressPercentage =
    progress && progress.total > 0
      ? Math.min(
          100,
          Math.round(
            (progress.current /
              progress.total) *
              100
          )
        )
      : 0;

  if (result) {
    return (
      <div className="mt-5 rounded-xl border border-emerald-300 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Paquete creado correctamente
        </p>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">
              ID permanente
            </dt>

            <dd className="break-all font-mono font-semibold text-slate-950">
              {result.permanentId}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">
              Package UUID
            </dt>

            <dd className="break-all font-mono text-xs text-slate-800">
              {result.packageId}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">
              Documentos cargados
            </dt>

            <dd className="font-semibold text-slate-950">
              {
                result.uploadedFilesCount
              }
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">
              Estado de verificación
            </dt>

            <dd className="font-semibold text-slate-950">
              {
                result.verificationStatus
              }
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">
              Estado de importación
            </dt>

            <dd className="font-semibold text-slate-950">
              {result.importStatus}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">
              Ruta en Storage
            </dt>

            <dd className="break-all font-mono text-xs text-slate-800">
              {result.storageRoot}
            </dd>
          </div>
        </dl>

        {onCreateAnother ? (
          <button
            type="button"
            onClick={onCreateAnother}
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Crear otro paquete
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-emerald-200 pt-5">
      <p className="text-sm font-semibold text-emerald-950">
        Carga real a Supabase
      </p>

      <p className="mt-1 text-xs leading-5 text-emerald-800">
        Esta acción cargará los archivos al
        bucket privado y registrará el paquete
        de evidencia en la base de datos.
      </p>

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading}
        className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading
          ? "Procesando paquete..."
          : "Crear paquete y cargar documentos"}
      </button>

      {progress ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {getStageLabel(
                progress.stage
              )}
            </p>

            {progress.stage ===
            "uploading" ? (
              <span className="text-xs font-semibold text-slate-500">
                {progress.current}/
                {progress.total}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-slate-600">
            {progress.message}
          </p>

          {progress.fileName ? (
            <p className="mt-1 break-all text-xs font-medium text-slate-800">
              {progress.fileName}
            </p>
          ) : null}

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width:
                  progress.stage ===
                    "registering" ||
                  progress.stage ===
                    "completed"
                    ? "100%"
                    : `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">
            No se pudo crear el paquete
          </p>

          <p className="mt-1 break-words text-xs leading-5">
            {errorMessage}
          </p>

          <p className="mt-2 text-xs text-red-700">
            Puede corregir el problema y volver
            a intentarlo. Los archivos de una
            carga incompleta se eliminan
            automáticamente cuando el rollback
            es exitoso.
          </p>
        </div>
      ) : null}
    </div>
  );
}
