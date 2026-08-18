import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

const EVIDENCE_BUCKET =
  "monthly-evidence-packages";

const SIGNED_URL_TTL_SECONDS =
  120;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EvidenceFileRouteContext = {
  params: Promise<{
    fileId: string;
  }>;
};

type EvidenceFileAccessRow = {
  id: string;
  package_id: string;
  file_name: string;
  storage_path: string;
};

type ImpactPermissionRow = {
  can_read:
    | boolean
    | null;
};

export const dynamic =
  "force-dynamic";

function jsonError(
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  context: EvidenceFileRouteContext
) {
  const {
    fileId,
  } = await context.params;

  if (
    !UUID_PATTERN.test(
      fileId
    )
  ) {
    return jsonError(
      "El identificador del documento no es válido.",
      400
    );
  }

  const requestedMode =
    request.nextUrl
      .searchParams
      .get("mode") ??
    "open";

  if (
    requestedMode !== "open" &&
    requestedMode !== "download"
  ) {
    return jsonError(
      "El modo solicitado no está permitido.",
      400
    );
  }

  const supabase =
    await createClient();

  // ==========================================================
  // 1. VALIDAR SESIÓN
  // ==========================================================

  const {
    data:
      authenticationData,

    error:
      authenticationError,
  } =
    await supabase.auth
      .getUser();

  if (
    authenticationError ||
    !authenticationData.user
  ) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    return NextResponse.redirect(
      loginUrl,
      307
    );
  }

  // ==========================================================
  // 2. VALIDAR PERMISOS INTERNOS
  // ==========================================================

  const {
    data:
      permissionDataRaw,

    error:
      permissionError,
  } =
    await supabase
      .rpc(
        "current_impact_user_permissions"
      )
      .maybeSingle();

  const permissionData =
    permissionDataRaw as
      | ImpactPermissionRow
      | null;

  if (permissionError) {
    console.error(
      "Evidence file permission lookup failed:",
      {
        userId:
          authenticationData
            .user.id,

        message:
          permissionError.message,

        code:
          permissionError.code,
      }
    );

    return jsonError(
      "No se pudieron comprobar los permisos del usuario.",
      500
    );
  }

  if (
    !permissionData ||
    permissionData.can_read !==
      true
  ) {
    return jsonError(
      "El usuario no tiene permisos para acceder a este documento.",
      403
    );
  }

  // ==========================================================
  // 3. RECUPERAR LA RUTA CONFIABLE DESDE LA BASE DE DATOS
  // ==========================================================

  const {
    data:
      evidenceFileData,

    error:
      evidenceFileError,
  } =
    await supabase
      .from(
        "monthly_evidence_files"
      )
      .select(
        `
          id,
          package_id,
          file_name,
          storage_path
        `
      )
      .eq(
        "id",
        fileId
      )
      .maybeSingle();

  if (evidenceFileError) {
    console.error(
      "Evidence file lookup failed:",
      {
        fileId,

        message:
          evidenceFileError.message,

        code:
          evidenceFileError.code,
      }
    );

    return jsonError(
      "No se pudo consultar el documento solicitado.",
      500
    );
  }

  if (!evidenceFileData) {
    return jsonError(
      "El documento solicitado no existe.",
      404
    );
  }

  const evidenceFile =
    evidenceFileData as
      EvidenceFileAccessRow;

  // ==========================================================
  // 4. CREAR URL FIRMADA TEMPORAL
  // ==========================================================

  const signedUrlResult =
    requestedMode ===
    "download"
      ? await supabase.storage
          .from(
            EVIDENCE_BUCKET
          )
          .createSignedUrl(
            evidenceFile
              .storage_path,

            SIGNED_URL_TTL_SECONDS,

            {
              download:
                evidenceFile
                  .file_name,
            }
          )

      : await supabase.storage
          .from(
            EVIDENCE_BUCKET
          )
          .createSignedUrl(
            evidenceFile
              .storage_path,

            SIGNED_URL_TTL_SECONDS
          );

  if (
    signedUrlResult.error ||
    !signedUrlResult.data
      ?.signedUrl
  ) {
    console.error(
      "Evidence signed URL creation failed:",
      {
        fileId,

        packageId:
          evidenceFile
            .package_id,

        storagePath:
          evidenceFile
            .storage_path,

        message:
          signedUrlResult
            .error?.message,
      }
    );

    return jsonError(
      "No se pudo generar el acceso temporal al documento.",
      500
    );
  }

  const redirectResponse =
    NextResponse.redirect(
      new URL(
        signedUrlResult
          .data
          .signedUrl
      ),
      307
    );

  redirectResponse.headers.set(
    "Cache-Control",
    "no-store"
  );

  return redirectResponse;
}