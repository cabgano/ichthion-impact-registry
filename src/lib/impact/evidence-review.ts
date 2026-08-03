import {
  createClient,
} from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type NumericDatabaseValue =
  | number
  | string
  | null;

type ServerSupabaseClient =
  Awaited<
    ReturnType<typeof createClient>
  >;

type RawEvidencePackage = {
  id: string;
  permanent_id: string;
  period_key: string;
  impact_line: string;
  scope_type: string;
  scope_code: string;
  scope_name: string;
  total_reported_kg:
    NumericDatabaseValue;
  impact_description: string | null;
  notes: string | null;
  verification_status: string;
  import_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type RawEvidenceFile = {
  id: string;
  package_id: string;
  file_role: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes:
    NumericDatabaseValue;
  declared_sha256: string | null;
  calculated_sha256: string | null;
  hash_match: boolean | null;
  hash_verified_at: string | null;
  is_required: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
  created_at: string;
  description: string | null;
};

type RawInternalUser = {
  id: string;
  full_name: string;
};

export type EvidenceIntegrityStatus =
  | "ready"
  | "incomplete"
  | "issue";

export type EvidenceFileReview = {
  id: string;
  packageId: string;
  fileRole: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  fileSizeBytes:
    NumericDatabaseValue;
  declaredSha256: string | null;
  calculatedSha256: string | null;
  hashMatch: boolean | null;
  hashVerifiedAt: string | null;
  isRequired: boolean;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
  description: string | null;
};

export type EvidenceIntegritySummary = {
  documentCount: number;
  lineReportCount: number;
  additionalEvidenceCount: number;
  hashVerifiedCount: number;
  matchingHashCount: number;
  issueCount: number;
  integrityStatus:
    EvidenceIntegrityStatus;
};

export type PendingEvidencePackage = {
  id: string;
  permanentId: string;
  periodKey: string;
  impactLine: string;
  scopeType: string;
  scopeCode: string;
  scopeName: string;
  totalReportedKg:
    NumericDatabaseValue;
  impactDescription: string | null;
  notes: string | null;
  verificationStatus: string;
  importStatus: string;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  integrity:
    EvidenceIntegritySummary;
};

export type EvidencePackageReview =
  PendingEvidencePackage & {
    files: EvidenceFileReview[];
  };

type EvidencePackageListResult = {
  packages:
    PendingEvidencePackage[];
  errorMessage: string | null;
};

type EvidencePackageDetailResult = {
  evidencePackage:
    EvidencePackageReview | null;
  errorMessage: string | null;
};

function combineErrorMessages(
  messages: Array<
    string | null | undefined
  >
) {
  const validMessages =
    messages.filter(
      (
        message
      ): message is string =>
        Boolean(message)
    );

  return validMessages.length > 0
    ? validMessages.join(" ")
    : null;
}

function getUniqueUserIds(
  values: Array<
    string | null
  >
) {
  return Array.from(
    new Set(
      values.filter(
        (
          value
        ): value is string =>
          Boolean(value)
      )
    )
  );
}

async function getInternalUserMap(
  supabase:
    ServerSupabaseClient,
  userIds: string[]
): Promise<{
  userMap: Map<string, string>;
  errorMessage: string | null;
}> {
  if (userIds.length === 0) {
    return {
      userMap:
        new Map<string, string>(),
      errorMessage: null,
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("internal_users")
    .select(
      "id, full_name"
    )
    .in(
      "id",
      userIds
    );

  if (error) {
    return {
      userMap:
        new Map<string, string>(),

      errorMessage:
        `No se pudieron resolver todos los nombres de usuarios internos: ${error.message}`,
    };
  }

  const rows =
    (data ?? []) as
      RawInternalUser[];

  return {
    userMap:
      new Map(
        rows.map(
          (row) => [
            row.id,
            row.full_name,
          ]
        )
      ),

    errorMessage: null,
  };
}

function mapEvidenceFile(
  row: RawEvidenceFile,
  userMap:
    Map<string, string>
): EvidenceFileReview {
  return {
    id: row.id,
    packageId:
      row.package_id,
    fileRole:
      row.file_role,
    fileName:
      row.file_name,
    storagePath:
      row.storage_path,
    mimeType:
      row.mime_type,
    fileSizeBytes:
      row.file_size_bytes,
    declaredSha256:
      row.declared_sha256,
    calculatedSha256:
      row.calculated_sha256,
    hashMatch:
      row.hash_match,
    hashVerifiedAt:
      row.hash_verified_at,
    isRequired:
      row.is_required,
    uploadedBy:
      row.uploaded_by,
    uploadedByName:
      row.uploaded_by
        ? userMap.get(
            row.uploaded_by
          ) ?? null
        : null,
    uploadedAt:
      row.uploaded_at,
    description:
      row.description,
  };
}

function buildIntegritySummary(
  files: EvidenceFileReview[]
): EvidenceIntegritySummary {
  const lineReportCount =
    files.filter(
      (file) =>
        file.fileRole ===
        "line_report"
    ).length;

  const additionalEvidenceCount =
    files.filter(
      (file) =>
        file.fileRole ===
        "optional_evidence"
    ).length;

  const hashVerifiedCount =
    files.filter(
      (file) =>
        Boolean(
          file.hashVerifiedAt
        ) &&
        Boolean(
          file.declaredSha256
        ) &&
        Boolean(
          file.calculatedSha256
        )
    ).length;

  const matchingHashCount =
    files.filter(
      (file) =>
        file.hashMatch === true
    ).length;

  const issueCount =
    files.filter(
      (file) =>
        file.hashMatch === false
    ).length;

  let integrityStatus:
    EvidenceIntegrityStatus =
      "incomplete";

  if (issueCount > 0) {
    integrityStatus = "issue";
  } else if (
    files.length > 0 &&
    lineReportCount === 1 &&
    hashVerifiedCount ===
      files.length &&
    matchingHashCount ===
      files.length
  ) {
    integrityStatus = "ready";
  }

  return {
    documentCount:
      files.length,
    lineReportCount,
    additionalEvidenceCount,
    hashVerifiedCount,
    matchingHashCount,
    issueCount,
    integrityStatus,
  };
}

function mapEvidencePackage(
  row: RawEvidencePackage,
  files: EvidenceFileReview[],
  userMap:
    Map<string, string>
): PendingEvidencePackage {
  return {
    id: row.id,
    permanentId:
      row.permanent_id,
    periodKey:
      row.period_key,
    impactLine:
      row.impact_line,
    scopeType:
      row.scope_type,
    scopeCode:
      row.scope_code,
    scopeName:
      row.scope_name,
    totalReportedKg:
      row.total_reported_kg,
    impactDescription:
      row.impact_description,
    notes:
      row.notes,
    verificationStatus:
      row.verification_status,
    importStatus:
      row.import_status,
    createdBy:
      row.created_by,
    createdByName:
      row.created_by
        ? userMap.get(
            row.created_by
          ) ?? null
        : null,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
    integrity:
      buildIntegritySummary(
        files
      ),
  };
}

export function isValidEvidencePackageId(
  value: string
) {
  return UUID_PATTERN.test(
    value
  );
}

export async function getPendingEvidencePackagesData(): Promise<EvidencePackageListResult> {
  const supabase =
    await createClient();

  const {
    data:
      packageData,
    error:
      packageError,
  } = await supabase
    .from(
      "monthly_evidence_packages"
    )
    .select(
      `
        id,
        permanent_id,
        period_key,
        impact_line,
        scope_type,
        scope_code,
        scope_name,
        total_reported_kg,
        impact_description,
        notes,
        verification_status,
        import_status,
        created_by,
        created_at,
        updated_at
      `
    )
    .eq(
      "verification_status",
      "draft"
    )
    .eq(
      "import_status",
      "not_imported"
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (packageError) {
    return {
      packages: [],
      errorMessage:
        `No se pudieron cargar los paquetes pendientes: ${packageError.message}`,
    };
  }

  const packageRows =
    (packageData ?? []) as
      RawEvidencePackage[];

  if (
    packageRows.length === 0
  ) {
    return {
      packages: [],
      errorMessage: null,
    };
  }

  const packageIds =
    packageRows.map(
      (row) => row.id
    );

  const {
    data: fileData,
    error: fileError,
  } = await supabase
    .from(
      "monthly_evidence_files"
    )
    .select(
      `
        id,
        package_id,
        file_role,
        file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        declared_sha256,
        calculated_sha256,
        hash_match,
        hash_verified_at,
        is_required,
        uploaded_by,
        uploaded_at,
        created_at,
        description
      `
    )
    .in(
      "package_id",
      packageIds
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  const fileRows =
    (fileData ?? []) as
      RawEvidenceFile[];

  const userIds =
    getUniqueUserIds([
      ...packageRows.map(
        (row) =>
          row.created_by
      ),
      ...fileRows.map(
        (row) =>
          row.uploaded_by
      ),
    ]);

  const {
    userMap,
    errorMessage:
      userErrorMessage,
  } =
    await getInternalUserMap(
      supabase,
      userIds
    );

  const filesByPackage =
    new Map<
      string,
      EvidenceFileReview[]
    >();

  for (
    const fileRow of fileRows
  ) {
    const mappedFile =
      mapEvidenceFile(
        fileRow,
        userMap
      );

    const currentFiles =
      filesByPackage.get(
        fileRow.package_id
      ) ?? [];

    currentFiles.push(
      mappedFile
    );

    filesByPackage.set(
      fileRow.package_id,
      currentFiles
    );
  }

  return {
    packages:
      packageRows.map(
        (packageRow) =>
          mapEvidencePackage(
            packageRow,
            filesByPackage.get(
              packageRow.id
            ) ?? [],
            userMap
          )
      ),

    errorMessage:
      combineErrorMessages([
        fileError
          ? `No se pudieron cargar todos los documentos: ${fileError.message}`
          : null,

        userErrorMessage,
      ]),
  };
}

export async function getEvidencePackageReviewData(
  packageId: string
): Promise<EvidencePackageDetailResult> {
  if (
    !isValidEvidencePackageId(
      packageId
    )
  ) {
    return {
      evidencePackage: null,
      errorMessage: null,
    };
  }

  const supabase =
    await createClient();

  const {
    data:
      packageData,
    error:
      packageError,
  } = await supabase
    .from(
      "monthly_evidence_packages"
    )
    .select(
      `
        id,
        permanent_id,
        period_key,
        impact_line,
        scope_type,
        scope_code,
        scope_name,
        total_reported_kg,
        impact_description,
        notes,
        verification_status,
        import_status,
        created_by,
        created_at,
        updated_at
      `
    )
    .eq(
      "id",
      packageId
    )
    .maybeSingle();

  if (packageError) {
    return {
      evidencePackage: null,
      errorMessage:
        `No se pudo cargar el paquete: ${packageError.message}`,
    };
  }

  if (!packageData) {
    return {
      evidencePackage: null,
      errorMessage: null,
    };
  }

  const packageRow =
    packageData as
      RawEvidencePackage;

  const {
    data:
      fileData,
    error:
      fileError,
  } = await supabase
    .from(
      "monthly_evidence_files"
    )
    .select(
      `
        id,
        package_id,
        file_role,
        file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        declared_sha256,
        calculated_sha256,
        hash_match,
        hash_verified_at,
        is_required,
        uploaded_by,
        uploaded_at,
        created_at,
        description
      `
    )
    .eq(
      "package_id",
      packageId
    )
    .order(
      "is_required",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  const fileRows =
    (fileData ?? []) as
      RawEvidenceFile[];

  const userIds =
    getUniqueUserIds([
      packageRow.created_by,
      ...fileRows.map(
        (row) =>
          row.uploaded_by
      ),
    ]);

  const {
    userMap,
    errorMessage:
      userErrorMessage,
  } =
    await getInternalUserMap(
      supabase,
      userIds
    );

  const files =
    fileRows.map(
      (fileRow) =>
        mapEvidenceFile(
          fileRow,
          userMap
        )
    );

  return {
    evidencePackage: {
      ...mapEvidencePackage(
        packageRow,
        files,
        userMap
      ),
      files,
    },

    errorMessage:
      combineErrorMessages([
        fileError
          ? `No se pudieron cargar todos los documentos: ${fileError.message}`
          : null,

        userErrorMessage,
      ]),
  };
}