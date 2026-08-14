import {
  createClient,
} from "@/lib/supabase/server";

type RawApprovedEvidencePackage = {
  id: string;
  permanent_id: string;

  period_key: string;
  impact_line: string;

  scope_type: string;
  scope_code: string;
  scope_name: string;

  total_reported_kg:
    | number
    | string
    | null;

  verification_status: string;
  import_status: string;

  verified_by:
    | string
    | null;

  verified_at:
    | string
    | null;

  created_at: string;
};

export type ApprovedEvidencePackage = {
  id: string;
  permanentId: string;

  periodKey: string;
  impactLine: string;

  scopeType: string;
  scopeCode: string;
  scopeName: string;

  totalReportedKg:
    | number
    | string
    | null;

  verificationStatus: string;
  importStatus: string;

  verifiedBy:
    | string
    | null;

  verifiedAt:
    | string
    | null;

  createdAt: string;
};

type ApprovedEvidencePackagesData = {
  packages:
    ApprovedEvidencePackage[];

  errorMessage:
    | string
    | null;
};

function normalizeApprovedPackage(
  evidencePackage:
    RawApprovedEvidencePackage
): ApprovedEvidencePackage {
  return {
    id:
      evidencePackage.id,

    permanentId:
      evidencePackage
        .permanent_id,

    periodKey:
      evidencePackage
        .period_key,

    impactLine:
      evidencePackage
        .impact_line,

    scopeType:
      evidencePackage
        .scope_type,

    scopeCode:
      evidencePackage
        .scope_code,

    scopeName:
      evidencePackage
        .scope_name,

    totalReportedKg:
      evidencePackage
        .total_reported_kg,

    verificationStatus:
      evidencePackage
        .verification_status,

    importStatus:
      evidencePackage
        .import_status,

    verifiedBy:
      evidencePackage
        .verified_by,

    verifiedAt:
      evidencePackage
        .verified_at,

    createdAt:
      evidencePackage
        .created_at,
  };
}

export async function getApprovedEvidencePackagesData(): Promise<ApprovedEvidencePackagesData> {
  const supabase =
    await createClient();

  const {
    data,
    error,
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
        verification_status,
        import_status,
        verified_by,
        verified_at,
        created_at
      `
    )
    .eq(
      "verification_status",
      "verified"
    )
    .eq(
      "import_status",
      "not_imported"
    )
    .order(
      "verified_at",
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    return {
      packages: [],

      errorMessage:
        error.message,
    };
  }

  const packages =
    (
      data ??
      []
    ) as RawApprovedEvidencePackage[];

  return {
    packages:
      packages.map(
        normalizeApprovedPackage
      ),

    errorMessage: null,
  };
}