import {
  createClient,
} from "@/lib/supabase/server";

export type EvidenceConversionMethodology = {
  code: string;
  version: string;
  status: string;
  is_default: boolean;

  native_mass_per_viu:
    | number
    | string;

  native_mass_unit: string;

  kg_per_viu:
    | number
    | string;

  kg_per_cent_viu:
    | number
    | string;

  residual_policy: string;
  methodology_manifest_hash: string;
};

export type EvidenceConversionPreview = {
  package_id: string;
  package_permanent_id: string;

  period_key: string;
  impact_line: string;

  scope_type: string;
  scope_code: string;
  scope_name: string;

  verification_status: string;
  import_status: string;

  reported_kg:
    | number
    | string;

  methodology:
    EvidenceConversionMethodology;

  creditable_kg:
    | number
    | string;

  viu_cents_generated: number;

  viu_amount:
    | number
    | string;

  full_viu_count: number;

  fractional_viu_cents: number;

  non_creditable_residual_kg:
    | number
    | string;

  accumulated_non_creditable_residual_before_kg:
    | number
    | string;

  accumulated_non_creditable_residual_after_kg:
    | number
    | string;

  residual_policy: string;

  can_process: boolean;
  preview_only: boolean;
};

type EvidenceConversionPreviewResult = {
  preview:
    | EvidenceConversionPreview
    | null;

  errorMessage:
    | string
    | null;
};

function isPreviewObject(
  value: unknown
): value is EvidenceConversionPreview {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const preview =
    value as Record<
      string,
      unknown
    >;

  const methodology =
    preview.methodology;

  if (
    !methodology ||
    typeof methodology !==
      "object"
  ) {
    return false;
  }

  const methodologyRecord =
    methodology as Record<
      string,
      unknown
    >;

  return (
    typeof preview
      .package_id ===
      "string" &&

    typeof preview
      .package_permanent_id ===
      "string" &&

    typeof preview
      .period_key ===
      "string" &&

    typeof preview
      .full_viu_count ===
      "number" &&

    typeof preview
      .fractional_viu_cents ===
      "number" &&

    typeof methodologyRecord
      .code ===
      "string" &&

    typeof methodologyRecord
      .version ===
      "string" &&

    typeof methodologyRecord
      .native_mass_unit ===
      "string"
  );
}

export async function getEvidenceConversionPreview(
  packageId: string,
  methodologyCode:
    | string
    | null = null
): Promise<EvidenceConversionPreviewResult> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "preview_evidence_package_conversion",
    {
      input_package_id:
        packageId,

      input_methodology_code:
        methodologyCode,
    }
  );

  if (error) {
    return {
      preview: null,

      errorMessage:
        error.message,
    };
  }

  if (!isPreviewObject(data)) {
    return {
      preview: null,

      errorMessage:
        "The conversion preview returned an invalid response.",
    };
  }

  return {
    preview: data,
    errorMessage: null,
  };
}
