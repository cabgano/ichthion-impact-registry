import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

type RawRecord = Record<string, unknown>;

type ImpactClientRow = {
  id: string;
  client_code: string | null;
  display_name: string | null;
  status: string | null;
  main_platform_client_id: string | null;
};

type PortalViuProjection = {
  tenant_id: string;

  registry_viu_asset_id: string;
  viu_permanent_id: string;

  period_key: string;
  impact_line: string | null;

  scope_type: string | null;
  scope_code: string | null;
  scope_name: string | null;

  methodology_code: string | null;

  viu_cents: number;
  viu_amount: number;
  kg_equivalent: number;

  asset_status: string | null;
  tokenization_status: string | null;
  future_token_id: string | null;

  allocation_reference: string | null;
  allocation_status: string | null;
  allocation_manifest_hash: string | null;

  verification_status: string | null;

  asset_manifest_hash: string | null;
  source_manifest_hash: string | null;

  mint_readiness_status: string | null;
  onchain_status: string | null;
  onchain_metadata_hash: string | null;

  chain_id: string | null;
  contract_address: string | null;
  token_id: string | null;
  token_uri: string | null;
  token_tx_hash: string | null;
  wallet_address: string | null;

  registry_created_at: string | null;
  registry_updated_at: string | null;

  synced_at: string;
  updated_at: string;
};

type EvidenceCandidate = {
  registryViuAssetId: string;

  registry_evidence_file_id: string;

  evidence_package_permanent_id: string | null;

  file_role: string | null;
  original_filename: string;
  mime_type: string | null;
  description: string | null;

  declared_sha256: string | null;
  calculated_sha256: string | null;
  hash_match: boolean | null;

  verification_status: string | null;

  registry_uploaded_at: string | null;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

function nullableString(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return String(value);
}

function requiredString(
  value: unknown,
  fieldName: string
) {
  const normalized = nullableString(value);

  if (!normalized) {
    throw new Error(
      `Required Registry field is missing: ${fieldName}`
    );
  }

  return normalized;
}

function numericValue(
  value: unknown,
  fieldName: string
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(
      `Invalid numeric Registry field ${fieldName}: ${String(value)}`
    );
  }

  return numberValue;
}

function nullableBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function packageKey(
  statementId: unknown,
  packageId: unknown,
  packagePermanentId: unknown
) {
  const statement =
    nullableString(statementId);

  const evidencePackage =
    nullableString(packageId) ??
    nullableString(packagePermanentId);

  if (!statement || !evidencePackage) {
    return null;
  }

  return `${statement}::${evidencePackage}`;
}

async function main() {
  const dryRun =
    process.argv.includes("--dry-run");

  const clientArgument =
    process.argv.find((argument) =>
      argument.startsWith("--client-code=")
    );

  const requestedClientCode =
    clientArgument
      ?.slice("--client-code=".length)
      .trim()
      .toLowerCase() || null;

  const registryUrl =
    requiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

  const registryServiceRole =
    requiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  const portalUrl =
    requiredEnv(
      "PORTAL_SUPABASE_URL"
    );

  const portalServiceRole =
    requiredEnv(
      "PORTAL_SUPABASE_SERVICE_ROLE_KEY"
    );

  const registry = createClient(
    registryUrl,
    registryServiceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const portal = createClient(
    portalUrl,
    portalServiceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  console.log("");
  console.log(
    "============================================="
  );
  console.log(
    " Ichthion Registry → Client Portal Projection"
  );
  console.log(
    "============================================="
  );
  console.log("");

  console.log(
    `Mode: ${dryRun ? "DRY RUN" : "WRITE"}`
  );

  if (requestedClientCode) {
    console.log(
      `Client filter: ${requestedClientCode}`
    );
  } else {
    console.log(
      "Client filter: all mapped clients"
    );
  }

  console.log("");

  // ==========================================================
  // 1. CLIENT → PORTAL TENANT MAPPING
  // ==========================================================

  const {
    data: clientData,
    error: clientError,
  } = await registry
    .from("impact_clients")
    .select(
      `
        id,
        client_code,
        display_name,
        status,
        main_platform_client_id
      `
    )
    .limit(1000);

  if (clientError) {
    throw new Error(
      `Could not read impact_clients: ${clientError.message}`
    );
  }

  const clients =
    (clientData as ImpactClientRow[] | null) ??
    [];

  const clientsById =
    new Map<string, ImpactClientRow>();

  for (const client of clients) {
    clientsById.set(
      client.id,
      client
    );
  }

  const mappedClients =
    clients.filter(
      (client) =>
        Boolean(
          client.main_platform_client_id
        )
    );

  console.log(
    `Registry clients: ${clients.length}`
  );

  console.log(
    `Clients mapped to Portal tenants: ${mappedClients.length}`
  );

  // ==========================================================
  // 2. CANONICAL ISSUED VIUs
  // ==========================================================

  const {
    data: verificationData,
    error: verificationError,
  } = await registry
    .from(
      "viu_asset_verification_page"
    )
    .select("*")
    .eq(
      "allocation_status",
      "issued"
    )
    .not(
      "client_id",
      "is",
      null
    )
    .limit(1000);

  if (verificationError) {
    throw new Error(
      `Could not read viu_asset_verification_page: ${verificationError.message}`
    );
  }

  const verificationRows =
    (verificationData as RawRecord[] | null) ??
    [];

  const now =
    new Date().toISOString();

  const portalVius:
    PortalViuProjection[] = [];

  const skippedWithoutTenant:
    string[] = [];

  for (
    const row of verificationRows
  ) {
    const clientId =
      requiredString(
        row.client_id,
        "client_id"
      );

    const client =
      clientsById.get(clientId);

    if (!client) {
      skippedWithoutTenant.push(
        `${clientId} (client not found)`
      );

      continue;
    }

    const clientCode =
      client.client_code
        ?.trim()
        .toLowerCase() ??
      "";

    if (
      requestedClientCode &&
      clientCode !==
        requestedClientCode
    ) {
      continue;
    }

    const tenantId =
      client.main_platform_client_id;

    if (!tenantId) {
      skippedWithoutTenant.push(
        `${client.client_code ?? client.id} (main_platform_client_id missing)`
      );

      continue;
    }

    const registryViuAssetId =
      requiredString(
        row.viu_asset_id,
        "viu_asset_id"
      );

    const permanentId =
      requiredString(
        row.viu_asset_permanent_id,
        "viu_asset_permanent_id"
      );

    const viuCents =
      numericValue(
        row.viu_cents,
        "viu_cents"
      );

    const kgEquivalent =
      numericValue(
        row.kg_equivalent,
        "kg_equivalent"
      );

    const viuAmount =
      row.viu_amount === null ||
      row.viu_amount === undefined
        ? viuCents / 100
        : numericValue(
            row.viu_amount,
            "viu_amount"
          );

    portalVius.push({
      tenant_id:
        tenantId,

      registry_viu_asset_id:
        registryViuAssetId,

      viu_permanent_id:
        permanentId,

      period_key:
        requiredString(
          row.period_key,
          "period_key"
        ),

      impact_line:
        nullableString(
          row.impact_line
        ),

      scope_type:
        nullableString(
          row.scope_type
        ),

      scope_code:
        nullableString(
          row.scope_code
        ),

      scope_name:
        nullableString(
          row.scope_name
        ),

      methodology_code:
        nullableString(
          row.methodology_code
        ),

      viu_cents:
        viuCents,

      viu_amount:
        viuAmount,

      kg_equivalent:
        kgEquivalent,

      asset_status:
        nullableString(
          row.asset_status
        ),

      tokenization_status:
        nullableString(
          row.tokenization_status
        ),

      future_token_id:
        nullableString(
          row.future_token_id
        ),

      allocation_reference:
        nullableString(
          row.allocation_reference
        ),

      allocation_status:
        nullableString(
          row.allocation_status
        ),

      allocation_manifest_hash:
        nullableString(
          row.allocation_manifest_hash
        ),

      verification_status:
        nullableString(
          row.verification_status
        ),

      asset_manifest_hash:
        nullableString(
          row.asset_manifest_hash
        ),

      source_manifest_hash:
        nullableString(
          row.source_manifest_hash ??
            row.source_snapshot_hash
        ),

      mint_readiness_status:
        nullableString(
          row.mint_readiness_status
        ),

      onchain_status:
        nullableString(
          row.onchain_status
        ),

      onchain_metadata_hash:
        nullableString(
          row.onchain_metadata_hash
        ),

      chain_id:
        nullableString(
          row.chain_id
        ),

      contract_address:
        nullableString(
          row.contract_address
        ),

      token_id:
        nullableString(
          row.token_id
        ),

      token_uri:
        nullableString(
          row.token_uri
        ),

      token_tx_hash:
        nullableString(
          row.token_tx_hash
        ),

      wallet_address:
        nullableString(
          row.wallet_address
        ),

      registry_created_at:
        nullableString(
          row.created_at
        ),

      registry_updated_at:
        nullableString(
          row.updated_at
        ),

      synced_at:
        now,

      updated_at:
        now,
    });
  }

  console.log("");
  console.log(
    `Issued VIUs found in Registry: ${verificationRows.length}`
  );

  console.log(
    `VIUs eligible for Portal projection: ${portalVius.length}`
  );

  if (
    skippedWithoutTenant.length > 0
  ) {
    console.log(
      `VIUs/clients skipped because Portal tenant mapping was unavailable: ${skippedWithoutTenant.length}`
    );
  }

  // ==========================================================
  // 3. READ VIU → EVIDENCE PACKAGE LINKS
  // ==========================================================

  const projectedRegistryViuIds =
    new Set(
      portalVius.map(
        (viu) =>
          viu.registry_viu_asset_id
      )
    );

  const {
    data: sourceData,
    error: sourceError,
  } = await registry
    .from(
      "monthly_impact_statement_sources"
    )
    .select(
      `
        statement_id,
        viu_asset_id,
        viu_asset_permanent_id,
        evidence_package_id,
        evidence_package_permanent_id,
        evidence_verification_status
      `
    )
    .not(
      "viu_asset_id",
      "is",
      null
    )
    .limit(1000);

  if (sourceError) {
    throw new Error(
      `Could not read monthly_impact_statement_sources: ${sourceError.message}`
    );
  }

  const sourceRows =
    (sourceData as RawRecord[] | null) ??
    [];

  type PackageLink = {
    registryViuAssetId: string;
    evidencePackagePermanentId:
      string | null;
    evidenceVerificationStatus:
      string | null;
  };

  const packageLinks =
    new Map<
      string,
      PackageLink[]
    >();

  for (
    const source of sourceRows
  ) {
    const viuAssetId =
      nullableString(
        source.viu_asset_id
      );

    if (
      !viuAssetId ||
      !projectedRegistryViuIds.has(
        viuAssetId
      )
    ) {
      continue;
    }

    const key =
      packageKey(
        source.statement_id,
        source.evidence_package_id,
        source.evidence_package_permanent_id
      );

    if (!key) {
      continue;
    }

    const existing =
      packageLinks.get(key) ??
      [];

    existing.push({
      registryViuAssetId:
        viuAssetId,

      evidencePackagePermanentId:
        nullableString(
          source.evidence_package_permanent_id
        ),

      evidenceVerificationStatus:
        nullableString(
          source.evidence_verification_status
        ),
    });

    packageLinks.set(
      key,
      existing
    );
  }

  // ==========================================================
  // 4. READ EVIDENCE FILE SNAPSHOTS
  // ==========================================================

  const {
    data: evidenceData,
    error: evidenceError,
  } = await registry
    .from(
      "monthly_impact_statement_evidence_files"
    )
    .select(
      `
        statement_id,
        evidence_file_id,
        evidence_package_id,
        evidence_package_permanent_id,
        file_role,
        original_filename,
        mime_type,
        description,
        declared_sha256,
        calculated_sha256,
        hash_match,
        uploaded_at
      `
    )
    .limit(1000);

  if (evidenceError) {
    throw new Error(
      `Could not read monthly_impact_statement_evidence_files: ${evidenceError.message}`
    );
  }

  const evidenceRows =
    (evidenceData as RawRecord[] | null) ??
    [];

  const evidenceCandidates =
    new Map<
      string,
      EvidenceCandidate
    >();

  for (
    const file of evidenceRows
  ) {
    const key =
      packageKey(
        file.statement_id,
        file.evidence_package_id,
        file.evidence_package_permanent_id
      );

    if (!key) {
      continue;
    }

    const links =
      packageLinks.get(key);

    if (
      !links ||
      links.length === 0
    ) {
      continue;
    }

    const evidenceFileId =
      requiredString(
        file.evidence_file_id,
        "evidence_file_id"
      );

    const originalFilename =
      requiredString(
        file.original_filename,
        "original_filename"
      );

    const hashMatch =
      nullableBoolean(
        file.hash_match
      );

    for (
      const link of links
    ) {
      let verificationStatus =
        link.evidenceVerificationStatus;

      if (hashMatch === true) {
        verificationStatus =
          "verified";
      }

      if (hashMatch === false) {
        verificationStatus =
          "hash_mismatch";
      }

      const dedupeKey =
        `${link.registryViuAssetId}::${evidenceFileId}`;

      evidenceCandidates.set(
        dedupeKey,
        {
          registryViuAssetId:
            link.registryViuAssetId,

          registry_evidence_file_id:
            evidenceFileId,

          evidence_package_permanent_id:
            nullableString(
              file.evidence_package_permanent_id
            ) ??
            link.evidencePackagePermanentId,

          file_role:
            nullableString(
              file.file_role
            ),

          original_filename:
            originalFilename,

          mime_type:
            nullableString(
              file.mime_type
            ),

          description:
            nullableString(
              file.description
            ),

          declared_sha256:
            nullableString(
              file.declared_sha256
            ),

          calculated_sha256:
            nullableString(
              file.calculated_sha256
            ),

          hash_match:
            hashMatch,

          verification_status:
            verificationStatus,

          registry_uploaded_at:
            nullableString(
              file.uploaded_at
            ),
        }
      );
    }
  }

  console.log(
    `VIU-linked evidence files found: ${evidenceCandidates.size}`
  );

  // ==========================================================
  // 5. DRY RUN STOPS HERE
  // ==========================================================

  if (dryRun) {
    console.log("");
    console.log(
      "DRY RUN COMPLETE — no Portal data was modified."
    );

    console.log("");

    console.log(
      "Sample VIUs:"
    );

    for (
      const viu of portalVius.slice(
        0,
        5
      )
    ) {
      console.log(
        `  ${viu.viu_permanent_id} | tenant=${viu.tenant_id} | ${viu.kg_equivalent} kg | ${viu.onchain_status ?? "no on-chain status"}`
      );
    }

    console.log("");

    console.log(
      "PASS: Registry projection payload can be constructed."
    );

    return;
  }

  // ==========================================================
  // 6. UPSERT VIUs INTO PORTAL SHADOW
  // ==========================================================

  if (
    portalVius.length === 0
  ) {
    console.log("");
    console.log(
      "No eligible VIUs to project."
    );

    return;
  }

  const {
    data: projectedPortalVius,
    error: portalViuError,
  } = await portal
    .from(
      "portal_vius"
    )
    .upsert(
      portalVius,
      {
        onConflict:
          "registry_viu_asset_id",
      }
    )
    .select(
      `
        id,
        tenant_id,
        registry_viu_asset_id,
        viu_permanent_id
      `
    );

  if (portalViuError) {
    throw new Error(
      `Could not project portal_vius: ${portalViuError.message}`
    );
  }

  const portalViuByRegistryId =
    new Map<
      string,
      {
        id: string;
        tenant_id: string;
      }
    >();

  for (
    const row of
      projectedPortalVius ?? []
  ) {
    portalViuByRegistryId.set(
      row.registry_viu_asset_id,
      {
        id:
          row.id,
        tenant_id:
          row.tenant_id,
      }
    );
  }

  console.log("");
  console.log(
    `portal_vius upserted: ${projectedPortalVius?.length ?? 0}`
  );

  // ==========================================================
  // 7. UPSERT VIU EVIDENCE INTO PORTAL SHADOW
  // ==========================================================

  const portalEvidenceRows =
    Array.from(
      evidenceCandidates.values()
    )
      .map(
        (candidate) => {
          const portalViu =
            portalViuByRegistryId.get(
              candidate.registryViuAssetId
            );

          if (!portalViu) {
            return null;
          }

          return {
            tenant_id:
              portalViu.tenant_id,

            portal_viu_id:
              portalViu.id,

            registry_evidence_file_id:
              candidate.registry_evidence_file_id,

            evidence_package_permanent_id:
              candidate.evidence_package_permanent_id,

            file_role:
              candidate.file_role,

            original_filename:
              candidate.original_filename,

            mime_type:
              candidate.mime_type,

            description:
              candidate.description,

            declared_sha256:
              candidate.declared_sha256,

            calculated_sha256:
              candidate.calculated_sha256,

            hash_match:
              candidate.hash_match,

            verification_status:
              candidate.verification_status,

            registry_uploaded_at:
              candidate.registry_uploaded_at,

            synced_at:
              now,

            updated_at:
              now,
          };
        }
      )
      .filter(
        (
          row
        ): row is NonNullable<
          typeof row
        > => row !== null
      );

  if (
    portalEvidenceRows.length > 0
  ) {
    const {
      data: projectedEvidence,
      error:
        portalEvidenceError,
    } = await portal
      .from(
        "portal_viu_evidence"
      )
      .upsert(
        portalEvidenceRows,
        {
          onConflict:
            "portal_viu_id,registry_evidence_file_id",
        }
      )
      .select(
        `
          id,
          portal_viu_id,
          registry_evidence_file_id
        `
      );

    if (
      portalEvidenceError
    ) {
      throw new Error(
        `Could not project portal_viu_evidence: ${portalEvidenceError.message}`
      );
    }

    console.log(
      `portal_viu_evidence upserted: ${projectedEvidence?.length ?? 0}`
    );
  } else {
    console.log(
      "portal_viu_evidence upserted: 0"
    );
  }

  console.log("");
  console.log(
    "PASS: Registry → Portal projection completed."
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "FAIL: Registry → Portal projection failed."
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);