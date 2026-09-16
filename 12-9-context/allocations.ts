import { createClient } from "@/lib/supabase/server";

export type ImpactRawValue = string | number | boolean | null | undefined;

export type ImpactRawRecord = Record<string, ImpactRawValue>;

export type ClientAllocation = ImpactRawRecord & {
  id?: string | null;
  permanent_id?: string | null;
  allocation_reference?: string | null;
  reference?: string | null;

  client_id?: string | null;
  client_code?: string | null;
  client_name?: string | null;
  client_display_name?: string | null;

  allocation_status?: string | null;
  status?: string | null;

  total_viu_cents?: number | null;
  viu_cents?: number | null;
  total_viu_amount?: string | number | null;
  viu_amount?: string | number | null;
  kg_equivalent?: string | number | null;

  allocation_manifest_hash?: string | null;
  manifest_hash?: string | null;

  issued_at?: string | null;
  created_at?: string | null;
};

export type AllocationSource = ImpactRawRecord & {
  id?: string | null;
  allocation_id?: string | null;
  allocation_reference?: string | null;

  source_type?: string | null;
  source_permanent_id?: string | null;
  viu_asset_id?: string | null;
  fractional_tranche_id?: string | null;

  viu_cents?: number | null;
  assigned_viu_cents?: number | null;
  viu_amount?: string | number | null;
  kg_equivalent?: string | number | null;

  source_status?: string | null;
  status?: string | null;

  source_manifest_hash?: string | null;
  manifest_hash?: string | null;
};

export type ImpactClient = ImpactRawRecord & {
  id?: string | null;

  client_code?: string | null;
  code?: string | null;

  display_name?: string | null;
  client_name?: string | null;
  name?: string | null;

  status?: string | null;
};

export type AllocationWithDetails = {
  allocation: ClientAllocation;
  client: ImpactClient | null;
  sources: AllocationSource[];
};

export type ImpactAllocationsData = {
  allocations: AllocationWithDetails[];
  clients: ImpactClient[];
  sources: AllocationSource[];
  errorMessage: string | null;
};

function valueToString(value: ImpactRawValue) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pickString(record: ImpactRawRecord | null, keys: string[]) {
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && String(value).length > 0) {
      return String(value);
    }
  }

  return "";
}

function allocationKeys(allocation: ClientAllocation) {
  return [
    pickString(allocation, ["id"]),
    pickString(allocation, ["permanent_id"]),
    pickString(allocation, ["allocation_reference"]),
    pickString(allocation, ["reference"]),
  ].filter(Boolean);
}

function sourceBelongsToAllocation(
  source: AllocationSource,
  allocation: ClientAllocation
) {
  const keys = allocationKeys(allocation);

  const sourceKeys = [
    pickString(source, ["allocation_id"]),
    pickString(source, ["allocation_reference"]),
  ].filter(Boolean);

  return sourceKeys.some((sourceKey) => keys.includes(sourceKey));
}

export async function getImpactAllocationsData(): Promise<ImpactAllocationsData> {
  const supabase = await createClient();

  const [allocationsResult, sourcesResult, clientsResult] = await Promise.all([
    supabase.from("client_allocations").select("*").limit(100),

    supabase.from("allocation_sources").select("*").limit(500),

    supabase.from("impact_clients").select("*").limit(100),
  ]);

  const firstError =
    allocationsResult.error || sourcesResult.error || clientsResult.error;

  const allocations =
    (allocationsResult.data as ClientAllocation[] | null) ?? [];

  const sources = (sourcesResult.data as AllocationSource[] | null) ?? [];

  const clients = (clientsResult.data as ImpactClient[] | null) ?? [];

  const allocationDetails = allocations.map((allocation) => {
    const clientId = pickString(allocation, ["client_id"]);
    const clientCode = pickString(allocation, ["client_code"]);

    const client =
      clients.find((item) => {
        const itemId = pickString(item, ["id"]);
        const itemCode = pickString(item, ["client_code", "code"]);

        return (
          valueToString(itemId) === clientId ||
          valueToString(itemCode) === clientCode
        );
      }) ?? null;

    return {
      allocation,
      client,
      sources: sources.filter((source) =>
        sourceBelongsToAllocation(source, allocation)
      ),
    };
  });

  return {
    allocations: allocationDetails,
    clients,
    sources,
    errorMessage: firstError?.message ?? null,
  };
}

export type AllocationDraftClient = {
  id: string;
  clientCode: string;
  displayName: string;
  status: string;
};

export type ActiveImpactClientsData = {
  clients: AllocationDraftClient[];
  errorMessage: string | null;
};

export async function getActiveImpactClientsData(): Promise<ActiveImpactClientsData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("impact_clients")
    .select(
      `
        id,
        client_code,
        display_name,
        status
      `
    )
    .eq("status", "active")
    .order("display_name", {
      ascending: true,
    });

  if (error) {
    return {
      clients: [],
      errorMessage: error.message,
    };
  }

  const clients: AllocationDraftClient[] = [];

  for (const item of data ?? []) {
    if (
      typeof item.id !== "string" ||
      typeof item.client_code !== "string" ||
      typeof item.display_name !== "string" ||
      typeof item.status !== "string"
    ) {
      continue;
    }

    clients.push({
      id: item.id,
      clientCode: item.client_code,
      displayName: item.display_name,
      status: item.status,
    });
  }

  return {
    clients,
    errorMessage: null,
  };
}

export type AllocationWorkspaceAsset = {
  id: string;
  permanentId: string;
  periodKey: string;
  impactLine: string;
  scopeCode: string;
  scopeName: string;
  viuCents: number;
  kgEquivalent: number;
  assetStatus: string;
  assetManifestHash: string | null;
  sourceVerifiedImpactPermanentId: string;
};

export type AllocationWorkspaceSource = {
  id: string;
  viuAssetId: string;
  sourcePermanentId: string;
  sourceStatus: string;
  viuCents: number;
  kgEquivalent: number;
  sourceManifestHash: string | null;
};

export type AllocationDraftWorkspaceData = {
  allocation: ClientAllocation | null;
  reservedSources: AllocationWorkspaceSource[];
  availableAssets: AllocationWorkspaceAsset[];
  errorMessage: string | null;
};

export async function getAllocationDraftWorkspaceData(
  allocationId: string
): Promise<AllocationDraftWorkspaceData> {
  const supabase = await createClient();

  const [
    allocationResult,
    sourcesResult,
    assetsResult,
  ] = await Promise.all([
    supabase
      .from("client_allocations")
      .select("*")
      .eq("id", allocationId)
      .maybeSingle(),

    supabase
      .from("allocation_sources")
      .select(
        `
          id,
          allocation_id,
          viu_asset_id,
          source_permanent_id,
          source_status,
          viu_cents,
          kg_equivalent,
          source_manifest_hash
        `
      )
      .eq("allocation_id", allocationId)
      .neq("source_status", "voided")
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("viu_assets")
      .select(
        `
          id,
          permanent_id,
          period_key,
          impact_line,
          scope_code,
          scope_name,
          viu_cents,
          kg_equivalent,
          asset_status,
          asset_manifest_hash,
          source_verified_impact_permanent_id
        `
      )
      .eq("asset_status", "available")
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const firstError =
    allocationResult.error ||
    sourcesResult.error ||
    assetsResult.error;

  if (firstError) {
    return {
      allocation: null,
      reservedSources: [],
      availableAssets: [],
      errorMessage: firstError.message,
    };
  }

  const allocation =
    (allocationResult.data as ClientAllocation | null) ??
    null;

  const reservedSources: AllocationWorkspaceSource[] =
    (sourcesResult.data ?? []).map((source) => ({
      id: String(source.id),
      viuAssetId: String(source.viu_asset_id),
      sourcePermanentId:
        String(source.source_permanent_id),
      sourceStatus:
        String(source.source_status),
      viuCents:
        Number(source.viu_cents),
      kgEquivalent:
        Number(source.kg_equivalent ?? 0),
      sourceManifestHash:
        source.source_manifest_hash
          ? String(source.source_manifest_hash)
          : null,
    }));

  const availableAssets: AllocationWorkspaceAsset[] =
    (assetsResult.data ?? []).map((asset) => ({
      id: String(asset.id),
      permanentId:
        String(asset.permanent_id),
      periodKey:
        String(asset.period_key),
      impactLine:
        String(asset.impact_line),
      scopeCode:
        String(asset.scope_code),
      scopeName:
        String(asset.scope_name),
      viuCents:
        Number(asset.viu_cents),
      kgEquivalent:
        Number(asset.kg_equivalent),
      assetStatus:
        String(asset.asset_status),
      assetManifestHash:
        asset.asset_manifest_hash
          ? String(asset.asset_manifest_hash)
          : null,
      sourceVerifiedImpactPermanentId:
        String(
          asset.source_verified_impact_permanent_id
        ),
    }));

  return {
    allocation,
    reservedSources,
    availableAssets,
    errorMessage: null,
  };
}