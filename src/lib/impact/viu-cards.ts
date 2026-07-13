import { createClient } from "@/lib/supabase/server";

export type ImpactRawValue = string | number | boolean | null | undefined;

export type ImpactRawRecord = Record<string, ImpactRawValue>;

export type ImpactViuAssetCard = ImpactRawRecord & {
  id?: string | null;
  permanent_id?: string | null;
  viu_asset_permanent_id?: string | null;
  asset_permanent_id?: string | null;

  asset_status?: string | null;
  status?: string | null;

  period_key?: string | null;
  impact_line?: string | null;
  scope_code?: string | null;
  scope_name?: string | null;

  viu_cents?: number | null;
  viu_amount?: number | string | null;
  kg_equivalent?: number | string | null;

  client_code?: string | null;
  client_name?: string | null;
  allocated_client_code?: string | null;
  allocated_client_name?: string | null;

  allocation_reference?: string | null;
  assigned_allocation_reference?: string | null;

  asset_manifest_hash?: string | null;
  manifest_hash?: string | null;

  tokenization_status?: string | null;
  future_token_id?: string | null;
  onchain_status?: string | null;

  created_at?: string | null;
};

export type ImpactViuCardsData = {
  cards: ImpactViuAssetCard[];
  availableCards: ImpactViuAssetCard[];
  summaryByStatus: ImpactRawRecord[];
  summaryByLine: ImpactRawRecord[];
  tokenReadiness: ImpactRawRecord[];
  errorMessage: string | null;
};

export async function getImpactViuCardsData(): Promise<ImpactViuCardsData> {
  const supabase = await createClient();

  const [
    cardsResult,
    availableCardsResult,
    summaryByStatusResult,
    summaryByLineResult,
    tokenReadinessResult,
  ] = await Promise.all([
    supabase.from("viu_asset_card_gallery").select("*").limit(100),

    supabase.from("available_viu_asset_cards").select("*").limit(100),

    supabase.from("viu_asset_cards_summary_by_status").select("*"),

    supabase.from("viu_asset_cards_summary_by_line").select("*"),

    supabase.from("viu_asset_token_readiness").select("*"),
  ]);

  const firstError =
    cardsResult.error ||
    availableCardsResult.error ||
    summaryByStatusResult.error ||
    summaryByLineResult.error ||
    tokenReadinessResult.error;

  return {
    cards: (cardsResult.data as ImpactViuAssetCard[] | null) ?? [],
    availableCards:
      (availableCardsResult.data as ImpactViuAssetCard[] | null) ?? [],
    summaryByStatus:
      (summaryByStatusResult.data as ImpactRawRecord[] | null) ?? [],
    summaryByLine: (summaryByLineResult.data as ImpactRawRecord[] | null) ?? [],
    tokenReadiness:
      (tokenReadinessResult.data as ImpactRawRecord[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}