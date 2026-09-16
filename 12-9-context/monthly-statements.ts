import {
  createClient,
} from "@/lib/supabase/server";

export type MonthlyStatementType =
  | "general"
  | "client";

export type MonthlyStatementStatus =
  | "draft"
  | "ready_for_review"
  | "issued"
  | "voided";

export type MonthlyStatementEventType =
  | "generated"
  | "ready_for_review"
  | "returned_to_draft"
  | "issued"
  | "voided"
  | "replaced";

export type NumericValue =
  | number
  | string
  | null;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
      [key: string]:
        | JsonValue
        | undefined;
    };

export type MonthlyImpactStatement = {
  id: string;
  permanent_id: string;
  statement_type: MonthlyStatementType;
  statement_period_key: string;
  statement_version: number;
  reporting_timezone: string;
  period_start_at: string;
  period_end_at: string;
  data_cutoff_at: string;

  client_id: string | null;
  client_code: string | null;
  client_display_name: string | null;

  statement_status: MonthlyStatementStatus;

  opening_verified_kg: NumericValue;
  opening_spendable_kg: NumericValue;
  opening_residual_kg: NumericValue;
  opening_assigned_kg: NumericValue;
  opening_total_controlled_kg: NumericValue;

  period_verified_kg_delta: NumericValue;
  period_spendable_kg_delta: NumericValue;
  period_residual_kg_delta: NumericValue;
  period_assigned_kg_delta: NumericValue;
  period_total_controlled_kg_delta: NumericValue;

  closing_verified_kg: NumericValue;
  closing_spendable_kg: NumericValue;
  closing_residual_kg: NumericValue;
  closing_assigned_kg: NumericValue;
  closing_total_controlled_kg: NumericValue;

  source_movement_count: number;
  evidence_package_count: number;
  verified_impact_count: number;
  conversion_batch_count: number;
  viu_asset_count: number;
  allocation_count: number;
  methodology_count: number;

  source_fingerprint_hash: string;
  manifest_version: string;
  statement_manifest_json: JsonValue;
  statement_manifest_hash: string;

  replaces_statement_id: string | null;

  generated_by: string;
  generated_at: string;

  issued_by: string | null;
  issued_at: string | null;

  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyStatementLine = {
  id: string;
  statement_id: string;
  line_sequence: number;

  balance_class: string;
  impact_period_key: string;
  impact_line: string;

  scope_id: string | null;
  scope_type: string;
  scope_code: string;
  scope_name: string;

  methodology_code: string | null;
  methodology_version: string | null;
  methodology_mass_per_viu: NumericValue;
  methodology_mass_unit: string | null;
  methodology_kg_per_viu: NumericValue;
  methodology_kg_per_cent_viu: NumericValue;
  methodology_manifest_hash: string | null;

  opening_verified_kg: NumericValue;
  opening_spendable_viu_cents: number;
  opening_spendable_kg: NumericValue;
  opening_residual_kg: NumericValue;
  opening_assigned_viu_cents: number;
  opening_assigned_kg: NumericValue;
  opening_total_controlled_kg: NumericValue;

  period_verified_kg_delta: NumericValue;
  period_spendable_viu_cents_delta: number;
  period_spendable_kg_delta: NumericValue;
  period_residual_kg_delta: NumericValue;
  period_assigned_viu_cents_delta: number;
  period_assigned_kg_delta: NumericValue;
  period_total_controlled_kg_delta: NumericValue;

  closing_verified_kg: NumericValue;
  closing_spendable_viu_cents: number;
  closing_spendable_kg: NumericValue;
  closing_residual_kg: NumericValue;
  closing_assigned_viu_cents: number;
  closing_assigned_kg: NumericValue;
  closing_total_controlled_kg: NumericValue;

  source_movement_count: number;
  evidence_package_count: number;
  verified_impact_count: number;
  conversion_batch_count: number;
  viu_asset_count: number;
  allocation_count: number;

  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyStatementSource = {
  id: string;
  statement_id: string;
  source_sequence: number;
  source_inclusion_role:
    | "opening_balance_support"
    | "period_activity";

  movement_id: string;
  movement_permanent_id: string;
  movement_created_at: string;
  activity_month_utc: string;
  impact_period_key: string;
  movement_type: string;
  movement_status: string;

  impact_line: string;
  scope_id: string | null;
  scope_type: string;
  scope_code: string;
  scope_name: string;

  client_id: string | null;
  client_code: string | null;
  client_display_name: string | null;

  source_type: string;
  source_id: string | null;
  source_permanent_id: string | null;

  methodology_code: string | null;
  methodology_version: string | null;
  methodology_mass_per_viu: NumericValue;
  methodology_mass_unit: string | null;
  methodology_kg_per_viu: NumericValue;
  methodology_kg_per_cent_viu: NumericValue;
  methodology_manifest_hash: string | null;

  verified_kg_balance_delta: NumericValue;
  spendable_viu_cents_delta: number;
  spendable_kg_equivalent_delta: NumericValue;
  residual_kg_delta: NumericValue;
  assigned_viu_cents_delta: number;
  assigned_kg_equivalent_delta: NumericValue;
  total_controlled_kg_delta: NumericValue;

  evidence_package_id: string | null;
  evidence_package_permanent_id: string | null;
  evidence_verification_status: string | null;
  evidence_import_status: string | null;
  evidence_manifest_storage_path: string | null;
  evidence_manifest_calculated_sha256: string | null;
  evidence_sealed_manifest_hash: string | null;
  evidence_file_count: number;
  valid_evidence_file_count: number;
  evidence_files_fingerprint_hash: string | null;

  verified_impact_id: string | null;
  verified_impact_permanent_id: string | null;

  conversion_batch_id: string | null;
  conversion_permanent_id: string | null;

  viu_asset_id: string | null;
  viu_asset_permanent_id: string | null;
  viu_asset_status: string | null;
  viu_asset_manifest_hash: string | null;

  allocation_source_id: string | null;
  allocation_source_status: string | null;
  allocation_id: string | null;
  allocation_permanent_id: string | null;
  allocation_reference: string | null;
  allocation_status: string | null;
  allocation_manifest_hash: string | null;

  mint_metadata_id: string | null;
  mint_metadata_permanent_id: string | null;
  onchain_metadata_hash: string | null;
  mint_readiness_status: string | null;
  onchain_status: string | null;

  chain_id: NumericValue;
  contract_address: string | null;
  token_id: string | null;
  token_uri: string | null;
  token_tx_hash: string | null;
  wallet_address: string | null;

  provenance_status: string;
  source_snapshot_schema: string;
  source_snapshot_json: JsonValue;
  source_snapshot_hash: string;

  created_by: string;
  created_at: string;
};

export type MonthlyStatementEvidenceFile = {
  id: string;
  statement_id: string;
  file_sequence: number;

  evidence_file_id: string;
  evidence_package_id: string;
  evidence_package_permanent_id: string;

  file_role: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: NumericValue;
  description: string | null;
  is_required: boolean;

  declared_sha256: string;
  calculated_sha256: string;
  hash_match: boolean;

  uploaded_by: string | null;
  uploaded_at: string;
  source_file_created_at: string;
  source_file_updated_at: string;

  file_snapshot_schema: string;
  file_snapshot_json: JsonValue;
  file_snapshot_hash: string;

  created_by: string | null;
  created_at: string;
};

export type MonthlyStatementEvent = {
  id: string;
  statement_id: string;
  event_sequence: number;
  event_type: MonthlyStatementEventType;

  statement_status_before:
    | MonthlyStatementStatus
    | null;

  statement_status_after:
    MonthlyStatementStatus;

  replacement_statement_id: string | null;
  event_reason: string | null;

  actor_user_id: string;
  actor_role: string;
  event_at: string;

  source_fingerprint_hash: string;
  statement_manifest_hash: string;
  previous_event_hash: string | null;

  event_manifest_schema: string;
  event_manifest_json: JsonValue;
  event_manifest_hash: string;

  created_at: string;
};

export type MonthlyStatementListItem =
  MonthlyImpactStatement & {
    actual_line_count: number;
    actual_source_count: number;
    actual_evidence_file_count: number;
    actual_event_count: number;
  };

export type MonthlyStatementsData = {
  statements: MonthlyStatementListItem[];
  periodKeys: string[];
  errorMessage: string | null;
};

export type MonthlyStatementIntegrity = {
  statement_hashes_present: boolean;
  source_snapshot_hashes_valid: boolean;
  evidence_hashes_valid: boolean;
  event_chain_linked: boolean;
  complete_hash_contract: boolean;
};

export type MonthlyStatementDetailData = {
  statement: MonthlyImpactStatement | null;
  lines: MonthlyStatementLine[];
  sources: MonthlyStatementSource[];
  evidenceFiles: MonthlyStatementEvidenceFile[];
  events: MonthlyStatementEvent[];
  integrity: MonthlyStatementIntegrity;
  errorMessage: string | null;
};

export type MonthlyStatementClient = {
  id: string;
  client_code: string;
  display_name: string;
  status: string;
};

export type MonthlyStatementClientsData = {
  clients: MonthlyStatementClient[];
  errorMessage: string | null;
};

type StatementChildReference = {
  statement_id: string;
};

function isSha256(
  value: string | null | undefined
) {
  return Boolean(
    value &&
      /^[0-9a-f]{64}$/.test(value)
  );
}

function createCountMap(
  rows: StatementChildReference[]
) {
  const counts =
    new Map<string, number>();

  for (const row of rows) {
    counts.set(
      row.statement_id,
      (counts.get(row.statement_id) ?? 0) + 1
    );
  }

  return counts;
}

function eventChainIsLinked(
  events: MonthlyStatementEvent[]
) {
  return events.every(
    (event, index) => {
      if (
        event.event_sequence !==
          index + 1 ||
        !isSha256(
          event.event_manifest_hash
        )
      ) {
        return false;
      }

      if (index === 0) {
        return (
          event.event_type ===
            "generated" &&
          event.previous_event_hash ===
            null
        );
      }

      return (
        event.previous_event_hash ===
        events[index - 1]
          .event_manifest_hash
      );
    }
  );
}

function buildIntegrity(
  statement: MonthlyImpactStatement,
  sources: MonthlyStatementSource[],
  evidenceFiles:
    MonthlyStatementEvidenceFile[],
  events: MonthlyStatementEvent[]
): MonthlyStatementIntegrity {
  const statementHashesPresent =
    isSha256(
      statement.source_fingerprint_hash
    ) &&
    isSha256(
      statement.statement_manifest_hash
    );

  const sourceSnapshotHashesValid =
    sources.every(
      (source) =>
        source.provenance_status ===
          "resolved" &&
        isSha256(
          source.source_snapshot_hash
        )
    );

  const evidenceHashesValid =
    evidenceFiles.every(
      (file) =>
        file.hash_match &&
        file.declared_sha256 ===
          file.calculated_sha256 &&
        isSha256(
          file.file_snapshot_hash
        )
    );

  const eventChainLinked =
    eventChainIsLinked(events);

  return {
    statement_hashes_present:
      statementHashesPresent,

    source_snapshot_hashes_valid:
      sourceSnapshotHashesValid,

    evidence_hashes_valid:
      evidenceHashesValid,

    event_chain_linked:
      eventChainLinked,

    complete_hash_contract:
      statementHashesPresent &&
      sourceSnapshotHashesValid &&
      evidenceHashesValid &&
      eventChainLinked,
  };
}

export async function getMonthlyImpactStatementsData():
Promise<MonthlyStatementsData> {
  const supabase =
    await createClient();

  const [
    statementsResult,
    linesResult,
    sourcesResult,
    evidenceResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from(
        "monthly_impact_statements"
      )
      .select("*")
      .order(
        "statement_period_key",
        {
          ascending: false,
        }
      ),

    supabase
      .from(
        "monthly_impact_statement_lines"
      )
      .select("statement_id"),

    supabase
      .from(
        "monthly_impact_statement_sources"
      )
      .select("statement_id"),

    supabase
      .from(
        "monthly_impact_statement_evidence_files"
      )
      .select("statement_id"),

    supabase
      .from(
        "monthly_impact_statement_events"
      )
      .select("statement_id"),
  ]);

  const firstError =
    statementsResult.error ||
    linesResult.error ||
    sourcesResult.error ||
    evidenceResult.error ||
    eventsResult.error;

  if (firstError) {
    return {
      statements: [],
      periodKeys: [],
      errorMessage:
        firstError.message,
    };
  }

  const statements =
    (
      statementsResult.data as
        | MonthlyImpactStatement[]
        | null
    ) ?? [];

  const lineCounts =
    createCountMap(
      (
        linesResult.data as
          | StatementChildReference[]
          | null
      ) ?? []
    );

  const sourceCounts =
    createCountMap(
      (
        sourcesResult.data as
          | StatementChildReference[]
          | null
      ) ?? []
    );

  const evidenceCounts =
    createCountMap(
      (
        evidenceResult.data as
          | StatementChildReference[]
          | null
      ) ?? []
    );

  const eventCounts =
    createCountMap(
      (
        eventsResult.data as
          | StatementChildReference[]
          | null
      ) ?? []
    );

  const statementItems =
    statements
      .map(
        (
          statement
        ): MonthlyStatementListItem => ({
          ...statement,

          actual_line_count:
            lineCounts.get(
              statement.id
            ) ?? 0,

          actual_source_count:
            sourceCounts.get(
              statement.id
            ) ?? 0,

          actual_evidence_file_count:
            evidenceCounts.get(
              statement.id
            ) ?? 0,

          actual_event_count:
            eventCounts.get(
              statement.id
            ) ?? 0,
        })
      )
      .sort((left, right) => {
        const periodComparison =
          right.statement_period_key.localeCompare(
            left.statement_period_key
          );

        if (periodComparison !== 0) {
          return periodComparison;
        }

        if (
          left.statement_type !==
          right.statement_type
        ) {
          return left.statement_type ===
            "general"
            ? -1
            : 1;
        }

        return (
          left.client_display_name ??
          ""
        ).localeCompare(
          right.client_display_name ??
            ""
        );
      });

  const periodKeys =
    Array.from(
      new Set(
        statementItems.map(
          (statement) =>
            statement.statement_period_key
        )
      )
    );

  return {
    statements: statementItems,
    periodKeys,
    errorMessage: null,
  };
}

export async function getMonthlyImpactStatementDetail(
  statementId: string
): Promise<MonthlyStatementDetailData> {
  const supabase =
    await createClient();

  const statementResult =
    await supabase
      .from(
        "monthly_impact_statements"
      )
      .select("*")
      .eq(
        "id",
        statementId
      )
      .maybeSingle();

  if (statementResult.error) {
    return {
      statement: null,
      lines: [],
      sources: [],
      evidenceFiles: [],
      events: [],
      integrity: {
        statement_hashes_present:
          false,
        source_snapshot_hashes_valid:
          false,
        evidence_hashes_valid:
          false,
        event_chain_linked:
          false,
        complete_hash_contract:
          false,
      },
      errorMessage:
        statementResult.error.message,
    };
  }

  const statement =
    statementResult.data as
      | MonthlyImpactStatement
      | null;

  if (!statement) {
    return {
      statement: null,
      lines: [],
      sources: [],
      evidenceFiles: [],
      events: [],
      integrity: {
        statement_hashes_present:
          false,
        source_snapshot_hashes_valid:
          false,
        evidence_hashes_valid:
          false,
        event_chain_linked:
          false,
        complete_hash_contract:
          false,
      },
      errorMessage: null,
    };
  }

  const [
    linesResult,
    sourcesResult,
    evidenceResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from(
        "monthly_impact_statement_lines"
      )
      .select("*")
      .eq(
        "statement_id",
        statementId
      )
      .order(
        "line_sequence",
        {
          ascending: true,
        }
      ),

    supabase
      .from(
        "monthly_impact_statement_sources"
      )
      .select("*")
      .eq(
        "statement_id",
        statementId
      )
      .order(
        "source_sequence",
        {
          ascending: true,
        }
      ),

    supabase
      .from(
        "monthly_impact_statement_evidence_files"
      )
      .select("*")
      .eq(
        "statement_id",
        statementId
      )
      .order(
        "file_sequence",
        {
          ascending: true,
        }
      ),

    supabase
      .from(
        "monthly_impact_statement_events"
      )
      .select("*")
      .eq(
        "statement_id",
        statementId
      )
      .order(
        "event_sequence",
        {
          ascending: true,
        }
      ),
  ]);

  const firstError =
    linesResult.error ||
    sourcesResult.error ||
    evidenceResult.error ||
    eventsResult.error;

  const lines =
    (
      linesResult.data as
        | MonthlyStatementLine[]
        | null
    ) ?? [];

  const sources =
    (
      sourcesResult.data as
        | MonthlyStatementSource[]
        | null
    ) ?? [];

  const evidenceFiles =
    (
      evidenceResult.data as
        | MonthlyStatementEvidenceFile[]
        | null
    ) ?? [];

  const events =
    (
      eventsResult.data as
        | MonthlyStatementEvent[]
        | null
    ) ?? [];

  return {
    statement,
    lines,
    sources,
    evidenceFiles,
    events,

    integrity:
      buildIntegrity(
        statement,
        sources,
        evidenceFiles,
        events
      ),

    errorMessage:
      firstError?.message ??
      null,
  };
}

export async function getMonthlyStatementClients():
Promise<MonthlyStatementClientsData> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("impact_clients")
    .select(
      `
        id,
        client_code,
        display_name,
        status
      `
    )
    .eq(
      "status",
      "active"
    )
    .order(
      "display_name",
      {
        ascending: true,
      }
    );

  if (error) {
    return {
      clients: [],
      errorMessage:
        error.message,
    };
  }

  return {
    clients:
      (
        data as
          | MonthlyStatementClient[]
          | null
      ) ?? [],

    errorMessage: null,
  };
}