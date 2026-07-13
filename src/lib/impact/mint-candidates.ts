import { createClient } from "@/lib/supabase/server";

export type ImpactRawValue = string | number | boolean | null | undefined;

export type ImpactRawRecord = Record<string, ImpactRawValue>;

export type MintCandidate = ImpactRawRecord & {
  id?: string | null;
  metadata_id?: string | null;
  permanent_id?: string | null;
  mint_permanent_id?: string | null;
  mint_reference?: string | null;

  viu_asset_id?: string | null;
  viu_asset_permanent_id?: string | null;
  asset_permanent_id?: string | null;
  source_permanent_id?: string | null;

  allocation_id?: string | null;
  allocation_reference?: string | null;

  client_id?: string | null;
  client_code?: string | null;
  client_name?: string | null;

  assigned_viu_cents?: number | null;
  assigned_viu_amount?: string | number | null;
  kg_equivalent?: string | number | null;

  mint_readiness_status?: string | null;
  onchain_status?: string | null;
  tokenization_status?: string | null;

  future_token_id?: string | null;
  chain_id?: string | number | null;
  contract_address?: string | null;
  token_id?: string | null;

  onchain_metadata_hash?: string | null;
  metadata_hash?: string | null;
  asset_manifest_hash?: string | null;
  allocation_manifest_hash?: string | null;

  created_at?: string | null;
  prepared_at?: string | null;
};

export type MintCandidatesData = {
  candidates: MintCandidate[];
  metadataRows: MintCandidate[];
  errorMessage: string | null;
};

export async function getMintCandidatesData(): Promise<MintCandidatesData> {
  const supabase = await createClient();

  const [candidatesResult, metadataResult] = await Promise.all([
    supabase.from("assigned_viu_mint_candidates").select("*").limit(100),

    supabase.from("assigned_viu_onchain_metadata").select("*").limit(100),
  ]);

  const firstError = candidatesResult.error || metadataResult.error;

  return {
    candidates: (candidatesResult.data as MintCandidate[] | null) ?? [],
    metadataRows: (metadataResult.data as MintCandidate[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}