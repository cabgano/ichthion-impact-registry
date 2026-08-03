import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET_NAME =
  "monthly-evidence-packages";

const MAX_FILE_SIZE_BYTES =
  20 * 1024 * 1024;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SHA256_PATTERN =
  /^[0-9a-f]{64}$/;

const SCOPE_CODE_PATTERN =
  /^[A-Z0-9_]+$/;

const ALLOWED_FILE_ROLES =
  new Set([
    "line_report",
    "optional_evidence",
  ]);

const ALLOWED_INTERNAL_ROLES =
  new Set([
    "technical_admin",
    "impact_admin",
  ]);

const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

type VerificationRequest = {
  package_id: string;
  file_id: string;
  storage_path: string;

  file_role:
    | "line_report"
    | "optional_evidence";

  file_name: string;
  mime_type: string | null;
  file_size_bytes: number;
  declared_sha256: string;
};

function jsonResponse(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json; charset=utf-8",
      },
    }
  );
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${fieldName} es obligatorio.`
    );
  }

  return value.trim();
}

function parseRequestBody(
  input: unknown
): VerificationRequest {
  if (!isRecord(input)) {
    throw new Error(
      "El cuerpo de la solicitud no es válido."
    );
  }

  const packageId =
    readRequiredString(
      input.package_id,
      "package_id"
    ).toLowerCase();

  const fileId =
    readRequiredString(
      input.file_id,
      "file_id"
    ).toLowerCase();

  const storagePath =
    readRequiredString(
      input.storage_path,
      "storage_path"
    );

  const fileRole =
    readRequiredString(
      input.file_role,
      "file_role"
    );

  const fileName =
    readRequiredString(
      input.file_name,
      "file_name"
    );

  const declaredSha256 =
    readRequiredString(
      input.declared_sha256,
      "declared_sha256"
    ).toLowerCase();

  const mimeType =
    input.mime_type === null ||
    input.mime_type === undefined
      ? null
      : readRequiredString(
          input.mime_type,
          "mime_type"
        );

  const fileSizeBytes =
    input.file_size_bytes;

  if (
    !UUID_PATTERN.test(
      packageId
    )
  ) {
    throw new Error(
      "package_id no es un UUID válido."
    );
  }

  if (
    !UUID_PATTERN.test(
      fileId
    )
  ) {
    throw new Error(
      "file_id no es un UUID válido."
    );
  }

  if (
    !ALLOWED_FILE_ROLES.has(
      fileRole
    )
  ) {
    throw new Error(
      "file_role no está permitido."
    );
  }

  if (
    fileName.length > 255
  ) {
    throw new Error(
      "file_name supera los 255 caracteres."
    );
  }

  if (
    storagePath.length > 1024
  ) {
    throw new Error(
      "storage_path supera el límite permitido."
    );
  }

  if (
    typeof fileSizeBytes !==
      "number" ||
    !Number.isInteger(
      fileSizeBytes
    ) ||
    fileSizeBytes < 0 ||
    fileSizeBytes >
      MAX_FILE_SIZE_BYTES
  ) {
    throw new Error(
      "file_size_bytes no es válido."
    );
  }

  if (
    !SHA256_PATTERN.test(
      declaredSha256
    )
  ) {
    throw new Error(
      "declared_sha256 no tiene formato SHA-256 válido."
    );
  }

  validateStoragePath({
    packageId,
    fileId,
    storagePath,
    fileRole,
  });

  return {
    package_id:
      packageId,

    file_id:
      fileId,

    storage_path:
      storagePath,

    file_role:
      fileRole as
        VerificationRequest["file_role"],

    file_name:
      fileName,

    mime_type:
      mimeType,

    file_size_bytes:
      fileSizeBytes,

    declared_sha256:
      declaredSha256,
  };
}

function validateStoragePath({
  packageId,
  fileId,
  storagePath,
  fileRole,
}: {
  packageId: string;
  fileId: string;
  storagePath: string;
  fileRole: string;
}) {
  const pathSegments =
    storagePath.split("/");

  if (
    pathSegments.length !== 4
  ) {
    throw new Error(
      "storage_path no cumple la estructura esperada."
    );
  }

  const [
    scopeCode,
    pathPackageId,
    pathFileRole,
    objectName,
  ] = pathSegments;

  if (
    !scopeCode ||
    !SCOPE_CODE_PATTERN.test(
      scopeCode
    )
  ) {
    throw new Error(
      "El scope_code de storage_path no es válido."
    );
  }

  if (
    pathPackageId
      .toLowerCase() !==
    packageId
  ) {
    throw new Error(
      "storage_path no pertenece al package_id enviado."
    );
  }

  if (
    pathFileRole !== fileRole
  ) {
    throw new Error(
      "storage_path no corresponde al file_role enviado."
    );
  }

  if (
    !objectName
      .toLowerCase()
      .startsWith(
        `${fileId}-`
      )
  ) {
    throw new Error(
      "storage_path no corresponde al file_id enviado."
    );
  }
}

function arrayBufferToHex(
  buffer: ArrayBuffer
): string {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

async function calculateSha256(
  file: Blob
): Promise<string> {
  const fileBuffer =
    await file.arrayBuffer();

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      fileBuffer
    );

  return arrayBufferToHex(
    digest
  );
}

Deno.serve(
  async (
    request: Request
  ): Promise<Response> => {
    // ========================================================
    // 1. CORS
    // ========================================================

    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          error:
            "Método no permitido.",
        },
        405
      );
    }


    // ========================================================
    // 2. OBTENER AUTORIZACIÓN
    // ========================================================

    const authorizationHeader =
      request.headers.get(
        "Authorization"
      );

    if (
      !authorizationHeader
    ) {
      return jsonResponse(
        {
          error:
            "No se recibió una sesión autenticada.",
        },
        401
      );
    }


    // ========================================================
    // 3. VARIABLES DE ENTORNO
    // ========================================================

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL"
      );

    const supabaseAnonKey =
      Deno.env.get(
        "SUPABASE_ANON_KEY"
      );

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Missing required Supabase environment variables."
      );

      return jsonResponse(
        {
          error:
            "La función no está configurada correctamente.",
        },
        500
      );
    }


    // ========================================================
    // 4. CLIENTE CON EL CONTEXTO DEL USUARIO
    // ========================================================

    const authenticatedClient =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization:
                authorizationHeader,
            },
          },

          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );


    // ========================================================
    // 5. VALIDAR LA SESIÓN
    // ========================================================

    const {
      data:
        authenticationData,

      error:
        authenticationError,
    } =
      await authenticatedClient
        .auth
        .getUser();

    const user =
      authenticationData.user;

    if (
      authenticationError ||
      !user
    ) {
      console.warn(
        "Evidence verification authentication failed:",
        {
          message:
            authenticationError
              ?.message,
        }
      );

      return jsonResponse(
        {
          error:
            "La sesión no es válida o ha expirado.",
        },
        401
      );
    }


    // ========================================================
    // 6. COMPROBAR ROL MEDIANTE LA RPC OFICIAL
    // ========================================================

    const {
      data:
        currentRoleData,

      error:
        roleError,
    } =
      await authenticatedClient
        .rpc(
          "current_internal_role"
        );

    if (roleError) {
      console.error(
        "Role lookup failed:",
        {
          userId:
            user.id,

          message:
            roleError.message,

          code:
            roleError.code,

          details:
            roleError.details,

          hint:
            roleError.hint,
        }
      );

      return jsonResponse(
        {
          error:
            "No se pudo consultar el rol interno del usuario.",
        },
        500
      );
    }

    const currentRole =
      typeof currentRoleData ===
        "string"
        ? currentRoleData.trim()
        : null;

    if (
      !currentRole ||
      !ALLOWED_INTERNAL_ROLES.has(
        currentRole
      )
    ) {
      console.warn(
        "Evidence verification denied:",
        {
          userId:
            user.id,

          currentRole,
        }
      );

      return jsonResponse(
        {
          error:
            "El usuario no tiene permisos para verificar evidencia.",
        },
        403
      );
    }


    // ========================================================
    // 7. CLIENTE ADMINISTRATIVO
    // ========================================================

    const adminClient =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );


    // ========================================================
    // 8. VALIDAR EL CUERPO DE LA SOLICITUD
    // ========================================================

    let verificationInput:
      VerificationRequest;

    try {
      const requestBody =
        await request.json();

      verificationInput =
        parseRequestBody(
          requestBody
        );
    } catch (error) {
      return jsonResponse(
        {
          error:
            error instanceof Error
              ? error.message
              : "La solicitud no es válida.",
        },
        400
      );
    }


    // ========================================================
    // 9. REVISAR VERIFICACIÓN PREVIA
    // ========================================================

    const {
      data:
        existingVerification,

      error:
        existingVerificationError,
    } =
      await adminClient
        .from(
          "evidence_upload_verifications"
        )
        .select(
          "id, storage_path, consumed_at"
        )
        .eq(
          "package_id",
          verificationInput
            .package_id
        )
        .eq(
          "file_id",
          verificationInput
            .file_id
        )
        .maybeSingle();

    if (
      existingVerificationError
    ) {
      console.error(
        "Existing verification lookup failed:",
        existingVerificationError
      );

      return jsonResponse(
        {
          error:
            "No se pudo revisar el estado previo de la verificación.",
        },
        500
      );
    }

    if (
      existingVerification
        ?.consumed_at
    ) {
      return jsonResponse(
        {
          error:
            "Esta verificación ya fue utilizada para registrar un paquete.",
        },
        409
      );
    }

    if (
      existingVerification &&
      existingVerification
        .storage_path !==
        verificationInput
          .storage_path
    ) {
      return jsonResponse(
        {
          error:
            "El file_id ya está relacionado con otra ruta de almacenamiento.",
        },
        409
      );
    }


    // ========================================================
    // 10. DESCARGAR EL ARCHIVO REAL DESDE STORAGE
    // ========================================================

    const {
      data:
        storedFile,

      error:
        downloadError,
    } =
      await adminClient
        .storage
        .from(
          BUCKET_NAME
        )
        .download(
          verificationInput
            .storage_path
        );

    if (
      downloadError ||
      !storedFile
    ) {
      console.error(
        "Storage download failed:",
        downloadError
      );

      return jsonResponse(
        {
          error:
            "No se pudo descargar el archivo almacenado para verificarlo.",
        },
        404
      );
    }


    // ========================================================
    // 11. VALIDAR EL TAMAÑO REAL
    // ========================================================

    const actualFileSize =
      storedFile.size;

    if (
      actualFileSize >
      MAX_FILE_SIZE_BYTES
    ) {
      return jsonResponse(
        {
          error:
            "El archivo almacenado supera el límite de 20 MB.",
        },
        413
      );
    }

    if (
      actualFileSize !==
      verificationInput
        .file_size_bytes
    ) {
      return jsonResponse(
        {
          error:
            "El tamaño del archivo almacenado no coincide con el tamaño declarado por el frontend.",

          expected_file_size_bytes:
            verificationInput
              .file_size_bytes,

          actual_file_size_bytes:
            actualFileSize,
        },
        409
      );
    }


    // ========================================================
    // 12. CALCULAR EL SEGUNDO SHA-256
    // ========================================================

    let calculatedSha256:
      string;

    try {
      calculatedSha256 =
        await calculateSha256(
          storedFile
        );
    } catch (error) {
      console.error(
        "SHA-256 calculation failed:",
        error
      );

      return jsonResponse(
        {
          error:
            "No se pudo calcular el SHA-256 del archivo almacenado.",
        },
        500
      );
    }

    if (
      !SHA256_PATTERN.test(
        calculatedSha256
      )
    ) {
      console.error(
        "Calculated SHA-256 has an invalid format."
      );

      return jsonResponse(
        {
          error:
            "El SHA-256 calculado por el servidor no tiene un formato válido.",
        },
        500
      );
    }


    // ========================================================
    // 13. COMPARAR AMBOS HASHES
    // ========================================================

    const hashMatch =
      verificationInput
        .declared_sha256 ===
      calculatedSha256;

    const verifiedAt =
      new Date().toISOString();


    // ========================================================
    // 14. GUARDAR LA VERIFICACIÓN TEMPORAL
    // ========================================================

    const {
      data:
        savedVerification,

      error:
        saveVerificationError,
    } =
      await adminClient
        .from(
          "evidence_upload_verifications"
        )
        .upsert(
          {
            package_id:
              verificationInput
                .package_id,

            file_id:
              verificationInput
                .file_id,

            storage_path:
              verificationInput
                .storage_path,

            file_role:
              verificationInput
                .file_role,

            file_name:
              verificationInput
                .file_name,

            mime_type:
              verificationInput
                .mime_type,

            file_size_bytes:
              actualFileSize,

            declared_sha256:
              verificationInput
                .declared_sha256,

            calculated_sha256:
              calculatedSha256,

            hash_match:
              hashMatch,

            verified_by:
              user.id,

            verified_at:
              verifiedAt,

            consumed_at:
              null,
          },
          {
            onConflict:
              "package_id,file_id",
          }
        )
        .select(
          `
            id,
            package_id,
            file_id,
            storage_path,
            declared_sha256,
            calculated_sha256,
            hash_match,
            verified_by,
            verified_at
          `
        )
        .single();

    if (
      saveVerificationError ||
      !savedVerification
    ) {
      console.error(
        "Verification save failed:",
        saveVerificationError
      );

      return jsonResponse(
        {
          error:
            "No se pudo registrar el resultado de integridad.",
        },
        500
      );
    }


    // ========================================================
    // 15. RESPUESTA
    // ========================================================

    return jsonResponse({
      verification_id:
        savedVerification.id,

      package_id:
        savedVerification
          .package_id,

      file_id:
        savedVerification
          .file_id,

      storage_path:
        savedVerification
          .storage_path,

      declared_sha256:
        savedVerification
          .declared_sha256,

      calculated_sha256:
        savedVerification
          .calculated_sha256,

      hash_match:
        savedVerification
          .hash_match,

      verified_at:
        savedVerification
          .verified_at,

      file_size_bytes:
        actualFileSize,

      message:
        hashMatch
          ? "La integridad del archivo fue confirmada."
          : "Los hashes no coinciden. El archivo no debe incorporarse al paquete.",
    });
  }
);