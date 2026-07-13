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
  client_name?: string | null;
  name?: string | null;
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