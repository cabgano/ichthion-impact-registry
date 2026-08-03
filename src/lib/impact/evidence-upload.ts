import type {
  EvidenceSelectedDocument,
} from "@/components/impact/EvidenceDocumentSlots";

import {
  calculateFileSha256,
  isValidSha256,
} from "@/lib/impact/sha256";

import { createClient } from "@/lib/supabase/client";

const EVIDENCE_BUCKET =
  "monthly-evidence-packages";

const VERIFICATION_FUNCTION =
  "verify-evidence-file";

const MAX_DOCUMENTS = 20;

const MAX_FILE_SIZE_BYTES =
  20 * 1024 * 1024;

export type EvidenceUploadProgress = {
  stage:
    | "hashing"
    | "uploading"
    | "verifying"
    | "registering"
    | "rollback"
    | "completed";

  current: number;
  total: number;
  fileName?: string;
  message: string;
};

export type EvidencePackageUploadInput = {
  periodKey: string;

  impactLine:
    | "technology"
    | "mingas"
    | "recyclers_base";

  scopeType:
    | "site"
    | "multi_site"
    | "company";

  scopeCode: string;
  scopeName: string;
  totalReportedKg: number;
  impactDescription: string;
  internalNotes: string;

  documents:
    EvidenceSelectedDocument[];

  onProgress?: (
    progress: EvidenceUploadProgress
  ) => void;
};

export type EvidencePackageUploadResult = {
  packageId: string;
  permanentId: string;
  verificationStatus: string;
  importStatus: string;
  storageRoot: string;
  uploadedFilesCount: number;
};

type DocumentWithFile =
  EvidenceSelectedDocument & {
    file: File;
  };

type RegisteredFilePayload = {
  id: string;

  file_role:
    | "line_report"
    | "optional_evidence";

  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number;
  description: string | null;

  declared_sha256: string;
};

type VerificationFunctionResult = {
  verification_id: string;
  package_id: string;
  file_id: string;
  storage_path: string;
  declared_sha256: string;
  calculated_sha256: string;
  hash_match: boolean;
  verified_at: string;
  file_size_bytes: number;
  message?: string;
};

function hasSelectedFile(
  document: EvidenceSelectedDocument
): document is DocumentWithFile {
  return document.file instanceof File;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function sanitizeFileName(
  originalFileName: string
) {
  const normalized =
    originalFileName
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  const safeFileName =
    normalized
      .replace(
        /[^A-Za-z0-9._-]+/g,
        "_"
      )
      .replace(/_+/g, "_")
      .replace(
        /^[_\-.]+|[_\-.]+$/g,
        ""
      );

  return safeFileName || "document";
}

function normalizeScopeCode(
  scopeCode: string
) {
  return scopeCode
    .trim()
    .toUpperCase();
}

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error desconocido.";
}

async function getFunctionErrorMessage(
  error: unknown
): Promise<string> {
  if (
    isRecord(error) &&
    error.context instanceof Response
  ) {
    try {
      const responseBody =
        await error.context
          .clone()
          .json();

      if (
        isRecord(responseBody) &&
        typeof responseBody.error ===
          "string"
      ) {
        return responseBody.error;
      }
    } catch {
      // Se utiliza el mensaje genérico
      // cuando la respuesta no contiene JSON.
    }
  }

  return getErrorMessage(error);
}

function parseVerificationResult(
  value: unknown
): VerificationFunctionResult {
  if (!isRecord(value)) {
    throw new Error(
      "La Edge Function no devolvió un resultado de verificación válido."
    );
  }

  const result: VerificationFunctionResult = {
    verification_id: String(
      value.verification_id ?? ""
    ),

    package_id: String(
      value.package_id ?? ""
    ),

    file_id: String(
      value.file_id ?? ""
    ),

    storage_path: String(
      value.storage_path ?? ""
    ),

    declared_sha256: String(
      value.declared_sha256 ?? ""
    ),

    calculated_sha256: String(
      value.calculated_sha256 ?? ""
    ),

    hash_match:
      value.hash_match === true,

    verified_at: String(
      value.verified_at ?? ""
    ),

    file_size_bytes: Number(
      value.file_size_bytes
    ),

    message:
      typeof value.message === "string"
        ? value.message
        : undefined,
  };

  if (
    !result.verification_id ||
    !result.package_id ||
    !result.file_id ||
    !result.storage_path ||
    !result.verified_at
  ) {
    throw new Error(
      "La respuesta de la Edge Function está incompleta."
    );
  }

  if (
    !isValidSha256(
      result.declared_sha256
    ) ||
    !isValidSha256(
      result.calculated_sha256
    )
  ) {
    throw new Error(
      "La Edge Function devolvió hashes con formato inválido."
    );
  }

  if (
    !Number.isInteger(
      result.file_size_bytes
    ) ||
    result.file_size_bytes < 0
  ) {
    throw new Error(
      "La Edge Function devolvió un tamaño de archivo inválido."
    );
  }

  return result;
}

export async function uploadEvidencePackage(
  input: EvidencePackageUploadInput
): Promise<EvidencePackageUploadResult> {
  const supabase = createClient();

  const packageId =
    crypto.randomUUID();

  const scopeCode =
    normalizeScopeCode(
      input.scopeCode
    );

  const selectedDocuments =
    input.documents.filter(
      hasSelectedFile
    );

  if (
    selectedDocuments.length < 1
  ) {
    throw new Error(
      "Debe seleccionar al menos el informe principal."
    );
  }

  if (
    selectedDocuments.length >
    MAX_DOCUMENTS
  ) {
    throw new Error(
      `No se pueden cargar más de ${MAX_DOCUMENTS} documentos.`
    );
  }

  const lineReportCount =
    selectedDocuments.filter(
      (document) =>
        document.role ===
        "line_report"
    ).length;

  if (lineReportCount !== 1) {
    throw new Error(
      "Debe existir exactamente un informe principal."
    );
  }

  for (
    const document of
    selectedDocuments
  ) {
    if (
      document.file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      throw new Error(
        `El archivo "${document.file.name}" supera el límite de 20 MB.`
      );
    }
  }

  const uploadedPaths: string[] =
    [];

  const registeredFiles:
    RegisteredFilePayload[] = [];

  try {
    for (
      let index = 0;
      index <
      selectedDocuments.length;
      index += 1
    ) {
      const document =
        selectedDocuments[index];

      const fileId =
        crypto.randomUUID();

      const safeFileName =
        sanitizeFileName(
          document.file.name
        );

      const storagePath = [
        scopeCode,
        packageId,
        document.role,
        `${fileId}-${safeFileName}`,
      ].join("/");


      // ======================================================
      // 1. PRIMER SHA-256: FRONTEND
      // ======================================================

      input.onProgress?.({
        stage: "hashing",
        current: index + 1,
        total:
          selectedDocuments.length,
        fileName:
          document.file.name,
        message:
          `Calculando la huella digital del documento ${index + 1} de ${selectedDocuments.length}.`,
      });

      const declaredSha256 =
        await calculateFileSha256(
          document.file
        );


      // ======================================================
      // 2. UPLOAD DEL ARCHIVO
      // ======================================================

      input.onProgress?.({
        stage: "uploading",
        current: index + 1,
        total:
          selectedDocuments.length,
        fileName:
          document.file.name,
        message:
          `Cargando documento ${index + 1} de ${selectedDocuments.length}.`,
      });

      const {
        error: uploadError,
      } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(
          storagePath,
          document.file,
          {
            contentType:
              document.file.type ||
              undefined,

            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          `No se pudo cargar "${document.file.name}": ${uploadError.message}`
        );
      }

      uploadedPaths.push(
        storagePath
      );


      // ======================================================
      // 3. SEGUNDO SHA-256: EDGE FUNCTION
      // ======================================================

      input.onProgress?.({
        stage: "verifying",
        current: index + 1,
        total:
          selectedDocuments.length,
        fileName:
          document.file.name,
        message:
          `Verificando el documento almacenado ${index + 1} de ${selectedDocuments.length}.`,
      });

      const {
        data: verificationData,
        error: verificationError,
      } = await supabase.functions.invoke(
        VERIFICATION_FUNCTION,
        {
          body: {
            package_id: packageId,
            file_id: fileId,
            storage_path:
              storagePath,
            file_role:
              document.role,
            file_name:
              document.file.name,
            mime_type:
              document.file.type ||
              null,
            file_size_bytes:
              document.file.size,
            declared_sha256:
              declaredSha256,
          },
        }
      );

      if (verificationError) {
        const functionMessage =
          await getFunctionErrorMessage(
            verificationError
          );

        throw new Error(
          `No se pudo verificar "${document.file.name}": ${functionMessage}`
        );
      }

      const verificationResult =
        parseVerificationResult(
          verificationData
        );

      if (
        verificationResult.package_id !==
        packageId
      ) {
        throw new Error(
          `La verificación de "${document.file.name}" corresponde a otro paquete.`
        );
      }

      if (
        verificationResult.file_id !==
        fileId
      ) {
        throw new Error(
          `La verificación de "${document.file.name}" corresponde a otro documento.`
        );
      }

      if (
        verificationResult.storage_path !==
        storagePath
      ) {
        throw new Error(
          `La verificación de "${document.file.name}" corresponde a otra ruta.`
        );
      }

      if (
        verificationResult
          .declared_sha256 !==
        declaredSha256
      ) {
        throw new Error(
          `La Edge Function no conservó el hash original de "${document.file.name}".`
        );
      }

      if (
        verificationResult
          .file_size_bytes !==
        document.file.size
      ) {
        throw new Error(
          `El tamaño almacenado de "${document.file.name}" no coincide con el archivo seleccionado.`
        );
      }

      if (
        verificationResult.hash_match
        !== true
      ) {
        throw new Error(
          verificationResult.message ||
          `Los hashes de "${document.file.name}" no coinciden.`
        );
      }


      // Solo se registra para la RPC después del match.
      registeredFiles.push({
        id: fileId,

        file_role:
          document.role,

        file_name:
          document.file.name,

        storage_path:
          storagePath,

        mime_type:
          document.file.type ||
          null,

        file_size_bytes:
          document.file.size,

        description:
          document.description
            .trim() ||
          null,

        declared_sha256:
          declaredSha256,
      });
    }


    // ========================================================
    // 4. REGISTRO DEFINITIVO DEL PAQUETE
    // ========================================================

    input.onProgress?.({
      stage: "registering",
      current:
        selectedDocuments.length,
      total:
        selectedDocuments.length,
      message:
        "Registrando el paquete y sus verificaciones de integridad.",
    });

    const {
      data,
      error: rpcError,
    } = await supabase.rpc(
      "register_monthly_evidence_package",
      {
        input_package_id:
          packageId,

        input_period_key:
          input.periodKey,

        input_impact_line:
          input.impactLine,

        input_scope_type:
          input.scopeType,

        input_scope_code:
          scopeCode,

        input_scope_name:
          input.scopeName,

        input_total_reported_kg:
          input.totalReportedKg,

        input_impact_description:
          input.impactDescription,

        input_notes:
          input.internalNotes ||
          null,

        input_files:
          registeredFiles,
      }
    );

    if (rpcError) {
      throw new Error(
        `Los documentos fueron verificados, pero no se pudo registrar el paquete: ${rpcError.message}`
      );
    }

    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "El RPC no devolvió la información del paquete."
      );
    }

    const result =
      data as Record<
        string,
        unknown
      >;

    if (
      result.integrity_verified !==
      true
    ) {
      throw new Error(
        "El RPC no confirmó la integridad del paquete."
      );
    }

    input.onProgress?.({
      stage: "completed",
      current:
        selectedDocuments.length,
      total:
        selectedDocuments.length,
      message:
        "Paquete registrado con integridad confirmada.",
    });

    return {
      packageId,

      permanentId: String(
        result.permanent_id ?? ""
      ),

      verificationStatus: String(
        result.verification_status ??
          "draft"
      ),

      importStatus: String(
        result.import_status ??
          "not_imported"
      ),

      storageRoot: String(
        result.storage_root ??
          `${scopeCode}/${packageId}`
      ),

      uploadedFilesCount:
        registeredFiles.length,
    };
  } catch (error) {
    const rollbackErrors: string[] =
      [];

    if (
      uploadedPaths.length > 0
    ) {
      input.onProgress?.({
        stage: "rollback",
        current: 0,
        total:
          uploadedPaths.length,
        message:
          "Revirtiendo archivos y verificaciones de la carga incompleta.",
      });

      const {
        error: storageCleanupError,
      } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .remove(uploadedPaths);

      if (storageCleanupError) {
        rollbackErrors.push(
          `No se eliminaron todos los archivos: ${storageCleanupError.message}`
        );
      }
    }

    const {
      error:
        verificationCleanupError,
    } = await supabase.rpc(
      "cleanup_evidence_upload_verifications",
      {
        input_package_id:
          packageId,
      }
    );

    if (
      verificationCleanupError
    ) {
      rollbackErrors.push(
        `No se eliminaron todas las verificaciones temporales: ${verificationCleanupError.message}`
      );
    }

    const originalMessage =
      getErrorMessage(error);

    if (
      rollbackErrors.length > 0
    ) {
      throw new Error(
        `${originalMessage} Además: ${rollbackErrors.join(
          " "
        )}`
      );
    }

    throw error;
  }
}