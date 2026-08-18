import {
  createClient,
} from "@/lib/supabase/server";

type RawConversionHistoryItem = {
  conversion_batch_id: string;
  conversion_permanent_id: string;

  source_verified_impact_id: string;
  source_verified_impact_permanent_id: string;

  evidence_package_id: string;
  evidence_package_permanent_id: string;

  period_key: string;
  impact_line: string;

  scope_type: string;
  scope_code: string;
  scope_name: string;

  kg_input:
    | number
    | string;

  converted_kg:
    | number
    | string;

  non_creditable_residual_kg:
    | number
    | string;

  methodology_code: string;
  methodology_version: string;

  methodology_mass_per_viu:
    | number
    | string;

  methodology_mass_unit: string;

  methodology_kg_per_viu:
    | number
    | string;

  methodology_kg_per_cent_viu:
    | number
    | string;

  methodology_manifest_hash: string;
  methodology_snapshot_ready: boolean;

  viu_cents_generated: number;
  full_viu_count: number;
  fractional_viu_cents: number;

  viu_asset_count: number;
  fractional_tranche_count: number;

  evidence_file_count: number;
  import_log_count: number;

  conversion_status: string;
  assets_generation_status: string;

  created_by:
    | string
    | null;

  created_at: string;

  assets_generated_by:
    | string
    | null;

  assets_generated_at:
    | string
    | null;

  traceability_ready: boolean;
};

export type ConversionHistoryItem = {
  conversionBatchId: string;
  conversionPermanentId: string;

  sourceVerifiedImpactId: string;
  sourceVerifiedImpactPermanentId: string;

  evidencePackageId: string;
  evidencePackagePermanentId: string;

  periodKey: string;
  impactLine: string;

  scopeType: string;
  scopeCode: string;
  scopeName: string;

  kgInput:
    | number
    | string;

  convertedKg:
    | number
    | string;

  nonCreditableResidualKg:
    | number
    | string;

  methodologyCode: string;
  methodologyVersion: string;

  methodologyMassPerViu:
    | number
    | string;

  methodologyMassUnit: string;

  methodologyKgPerViu:
    | number
    | string;

  methodologyKgPerCentViu:
    | number
    | string;

  methodologyManifestHash: string;
  methodologySnapshotReady: boolean;

  viuCentsGenerated: number;
  fullViuCount: number;
  fractionalViuCents: number;

  viuAssetCount: number;
  fractionalTrancheCount: number;

  evidenceFileCount: number;
  importLogCount: number;

  conversionStatus: string;
  assetsGenerationStatus: string;

  createdBy:
    | string
    | null;

  createdAt: string;

  assetsGeneratedBy:
    | string
    | null;

  assetsGeneratedAt:
    | string
    | null;

  traceabilityReady: boolean;
};

export type ConversionHistoryData = {
  conversions:
    ConversionHistoryItem[];

  errorMessage:
    | string
    | null;
};

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null
  );
}

function isNumberOrString(
  value: unknown
): value is
  | number
  | string {
  return (
    typeof value ===
      "number" ||
    typeof value ===
      "string"
  );
}

function isRawConversionHistoryItem(
  value: unknown
): value is RawConversionHistoryItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value
      .conversion_batch_id ===
      "string" &&

    typeof value
      .conversion_permanent_id ===
      "string" &&

    typeof value
      .source_verified_impact_id ===
      "string" &&

    typeof value
      .source_verified_impact_permanent_id ===
      "string" &&

    typeof value
      .evidence_package_id ===
      "string" &&

    typeof value
      .evidence_package_permanent_id ===
      "string" &&

    typeof value
      .period_key ===
      "string" &&

    typeof value
      .impact_line ===
      "string" &&

    typeof value
      .scope_type ===
      "string" &&

    typeof value
      .scope_code ===
      "string" &&

    typeof value
      .scope_name ===
      "string" &&

    isNumberOrString(
      value.kg_input
    ) &&

    isNumberOrString(
      value.converted_kg
    ) &&

    isNumberOrString(
      value
        .non_creditable_residual_kg
    ) &&

    typeof value
      .methodology_code ===
      "string" &&

    typeof value
      .methodology_version ===
      "string" &&

    isNumberOrString(
      value
        .methodology_mass_per_viu
    ) &&

    typeof value
      .methodology_mass_unit ===
      "string" &&

    isNumberOrString(
      value
        .methodology_kg_per_viu
    ) &&

    isNumberOrString(
      value
        .methodology_kg_per_cent_viu
    ) &&

    typeof value
      .methodology_manifest_hash ===
      "string" &&

    typeof value
      .methodology_snapshot_ready ===
      "boolean" &&

    typeof value
      .viu_cents_generated ===
      "number" &&

    typeof value
      .full_viu_count ===
      "number" &&

    typeof value
      .fractional_viu_cents ===
      "number" &&

    typeof value
      .viu_asset_count ===
      "number" &&

    typeof value
      .fractional_tranche_count ===
      "number" &&

    typeof value
      .evidence_file_count ===
      "number" &&

    typeof value
      .import_log_count ===
      "number" &&

    typeof value
      .conversion_status ===
      "string" &&

    typeof value
      .assets_generation_status ===
      "string" &&

    typeof value
      .created_at ===
      "string" &&

    typeof value
      .traceability_ready ===
      "boolean"
  );
}

function normalizeConversionHistoryItem(
  conversion:
    RawConversionHistoryItem
): ConversionHistoryItem {
  return {
    conversionBatchId:
      conversion
        .conversion_batch_id,

    conversionPermanentId:
      conversion
        .conversion_permanent_id,

    sourceVerifiedImpactId:
      conversion
        .source_verified_impact_id,

    sourceVerifiedImpactPermanentId:
      conversion
        .source_verified_impact_permanent_id,

    evidencePackageId:
      conversion
        .evidence_package_id,

    evidencePackagePermanentId:
      conversion
        .evidence_package_permanent_id,

    periodKey:
      conversion.period_key,

    impactLine:
      conversion.impact_line,

    scopeType:
      conversion.scope_type,

    scopeCode:
      conversion.scope_code,

    scopeName:
      conversion.scope_name,

    kgInput:
      conversion.kg_input,

    convertedKg:
      conversion.converted_kg,

    nonCreditableResidualKg:
      conversion
        .non_creditable_residual_kg,

    methodologyCode:
      conversion
        .methodology_code,

    methodologyVersion:
      conversion
        .methodology_version,

    methodologyMassPerViu:
      conversion
        .methodology_mass_per_viu,

    methodologyMassUnit:
      conversion
        .methodology_mass_unit,

    methodologyKgPerViu:
      conversion
        .methodology_kg_per_viu,

    methodologyKgPerCentViu:
      conversion
        .methodology_kg_per_cent_viu,

    methodologyManifestHash:
      conversion
        .methodology_manifest_hash,

    methodologySnapshotReady:
      conversion
        .methodology_snapshot_ready,

    viuCentsGenerated:
      conversion
        .viu_cents_generated,

    fullViuCount:
      conversion
        .full_viu_count,

    fractionalViuCents:
      conversion
        .fractional_viu_cents,

    viuAssetCount:
      conversion
        .viu_asset_count,

    fractionalTrancheCount:
      conversion
        .fractional_tranche_count,

    evidenceFileCount:
      conversion
        .evidence_file_count,

    importLogCount:
      conversion
        .import_log_count,

    conversionStatus:
      conversion
        .conversion_status,

    assetsGenerationStatus:
      conversion
        .assets_generation_status,

    createdBy:
      conversion.created_by,

    createdAt:
      conversion.created_at,

    assetsGeneratedBy:
      conversion
        .assets_generated_by,

    assetsGeneratedAt:
      conversion
        .assets_generated_at,

    traceabilityReady:
      conversion
        .traceability_ready,
  };
}

export async function getConversionHistoryData(): Promise<ConversionHistoryData> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_conversion_history"
  );

  if (error) {
    return {
      conversions: [],

      errorMessage:
        error.message,
    };
  }

  if (!Array.isArray(data)) {
    return {
      conversions: [],

      errorMessage:
        "The conversion history RPC returned an invalid response.",
    };
  }

  const invalidItem =
    data.find(
      (
        item
      ) =>
        !isRawConversionHistoryItem(
          item
        )
    );

  if (invalidItem) {
    return {
      conversions: [],

      errorMessage:
        "One or more conversion history records have an invalid structure.",
    };
  }

  return {
    conversions:
      data.map(
        (
          item
        ) =>
          normalizeConversionHistoryItem(
            item
          )
      ),

    errorMessage: null,
  };
}


type RawTraceabilitySummary = {
  conversion_id: string;
  conversion_permanent_id: string;

  evidence_package_id: string;
  evidence_package_permanent_id: string;

  verified_impact_id: string;
  verified_impact_permanent_id: string;

  viu_asset_count: number;
  fractional_tranche_count: number;
  evidence_file_count: number;

  expected_full_viu_count: number;
  expected_fractional_tranche_count: number;

  traceability_ready: boolean;
};

type RawEvidencePackage = {
  id: string;
  permanent_id: string;

  period_key: string;
  impact_line: string;

  scope_type: string;
  scope_code: string;
  scope_name: string;

  total_reported_kg:
    | number
    | string;

  verification_status: string;
  import_status: string;

  impact_description:
    | string
    | null;

  verified_at:
    | string
    | null;

  imported_at:
    | string
    | null;

  created_at: string;
};

type RawEvidenceFile = {
  id: string;
  file_role: string;
  file_name: string;

  mime_type:
    | string
    | null;

  file_size_bytes:
    | number
    | string
    | null;

  hash_match:
    | boolean
    | null;

  hash_verified_at:
    | string
    | null;

  uploaded_at: string;
};

type RawVerifiedImpact = {
  id: string;
  permanent_id: string;

  verified_kg:
    | number
    | string;

  kg_available_for_conversion:
    | number
    | string;

  kg_converted_to_viu:
    | number
    | string;

  kg_residual_current:
    | number
    | string;

  conversion_status: string;
  record_status: string;

  imported_at:
    | string
    | null;
};

type RawImportLog = {
  id: string;
  result_status: string;

  kg_imported:
    | number
    | string
    | null;

  message: string;
  created_at: string;
};

type RawWalletMovement = {
  id: string;
  permanent_id: string;

  movement_type: string;
  source_type: string;

  source_permanent_id:
    | string
    | null;

  verified_kg_balance_delta:
    | number
    | string;

  spendable_viu_cents_delta: number;

  residual_kg_delta:
    | number
    | string;

  assigned_viu_cents_delta: number;

  movement_status: string;

  notes:
    | string
    | null;

  created_at: string;
};

type RawConversionBatch = {
  id: string;
  permanent_id: string;

  period_key: string;
  impact_line: string;

  scope_type: string;
  scope_code: string;
  scope_name: string;

  kg_input:
    | number
    | string;

  converted_kg:
    | number
    | string;

  residual_kg:
    | number
    | string;

  viu_cents_generated: number;
  full_viu_count: number;
  fractional_viu_cents: number;

  methodology_code?: string;
  methodology_version?: string;

  methodology_mass_per_viu?:
    | number
    | string;

  methodology_mass_unit?: string;

  methodology_kg_per_viu?:
    | number
    | string;

  methodology_kg_per_cent_viu?:
    | number
    | string;

  methodology_manifest_hash?: string;

  conversion_status: string;
  assets_generation_status: string;

  created_at: string;

  assets_generated_at:
    | string
    | null;
};

type RawViuAsset = {
  id: string;
  permanent_id: string;

  asset_sequence_in_batch: number;

  methodology_code: string;

  viu_cents: number;

  kg_equivalent:
    | number
    | string;

  asset_status: string;
  tokenization_status: string;

  asset_manifest_hash:
    | string
    | null;

  created_at: string;
};

type RawFractionalTranche = {
  id: string;
  permanent_id: string;

  methodology_code: string;

  total_viu_cents: number;
  available_viu_cents: number;
  allocated_viu_cents: number;

  kg_equivalent:
    | number
    | string;

  tranche_status: string;

  tranche_manifest_hash:
    | string
    | null;

  created_at: string;
};

type RawProcessChainStep = {
  step: number;
  entity_type: string;

  permanent_id?:
    | string
    | null;

  full_viu_count?: number;
  fractional_tranche_count?: number;
};

type RawConversionTraceability = {
  summary:
    RawTraceabilitySummary;

  evidence_package:
    RawEvidencePackage;

  evidence_files:
    RawEvidenceFile[];

  verified_impact:
    RawVerifiedImpact;

  import_logs:
    RawImportLog[];

  import_movement:
    RawWalletMovement |
    null;

  conversion_batch:
    RawConversionBatch;

  conversion_movement:
    RawWalletMovement |
    null;

  viu_assets:
    RawViuAsset[];

  fractional_viu_tranches:
    RawFractionalTranche[];

  process_chain:
    RawProcessChainStep[];
};

export type ConversionTraceability =
  RawConversionTraceability;

export type ConversionTraceabilityData = {
  traceability:
    ConversionTraceability |
    null;

  errorMessage:
    string |
    null;
};

function isRawWalletMovement(
  value: unknown
): value is RawWalletMovement {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.permanent_id ===
      "string" &&
    typeof value.movement_type ===
      "string" &&
    typeof value.source_type ===
      "string" &&
    isNumberOrString(
      value
        .verified_kg_balance_delta
    ) &&
    typeof value
      .spendable_viu_cents_delta ===
      "number" &&
    isNumberOrString(
      value.residual_kg_delta
    ) &&
    typeof value
      .assigned_viu_cents_delta ===
      "number" &&
    typeof value.movement_status ===
      "string" &&
    typeof value.created_at ===
      "string"
  );
}

function isRawConversionTraceability(
  value: unknown
): value is RawConversionTraceability {
  if (!isRecord(value)) {
    return false;
  }

  const summary =
    value.summary;

  const evidencePackage =
    value.evidence_package;

  const verifiedImpact =
    value.verified_impact;

  const conversionBatch =
    value.conversion_batch;

  if (
    !isRecord(summary) ||
    !isRecord(evidencePackage) ||
    !isRecord(verifiedImpact) ||
    !isRecord(conversionBatch)
  ) {
    return false;
  }

  return (
    typeof summary
      .conversion_id ===
      "string" &&

    typeof summary
      .conversion_permanent_id ===
      "string" &&

    typeof summary
      .evidence_package_id ===
      "string" &&

    typeof summary
      .verified_impact_id ===
      "string" &&

    typeof summary
      .viu_asset_count ===
      "number" &&

    typeof summary
      .fractional_tranche_count ===
      "number" &&

    typeof summary
      .traceability_ready ===
      "boolean" &&

    typeof evidencePackage.id ===
      "string" &&

    typeof evidencePackage
      .permanent_id ===
      "string" &&

    typeof verifiedImpact.id ===
      "string" &&

    typeof verifiedImpact
      .permanent_id ===
      "string" &&

    typeof conversionBatch.id ===
      "string" &&

    typeof conversionBatch
      .permanent_id ===
      "string" &&

    Array.isArray(
      value.evidence_files
    ) &&

    Array.isArray(
      value.import_logs
    ) &&

    Array.isArray(
      value.viu_assets
    ) &&

    Array.isArray(
      value
        .fractional_viu_tranches
    ) &&

    Array.isArray(
      value.process_chain
    ) &&

    (
      value.import_movement ===
        null ||
      isRawWalletMovement(
        value.import_movement
      )
    ) &&

    (
      value
        .conversion_movement ===
        null ||
      isRawWalletMovement(
        value
          .conversion_movement
      )
    )
  );
}

export function isValidConversionId(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function getConversionTraceabilityData(
  conversionId: string
): Promise<ConversionTraceabilityData> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_conversion_traceability",
    {
      input_conversion_id:
        conversionId,
    }
  );

  if (error) {
    return {
      traceability: null,

      errorMessage:
        error.message,
    };
  }

  if (
    !isRawConversionTraceability(
      data
    )
  ) {
    return {
      traceability: null,

      errorMessage:
        "The conversion traceability RPC returned an invalid response.",
    };
  }

  return {
    traceability: data,
    errorMessage: null,
  };
}