import { createClient } from "@/lib/supabase/server";

export type ImpactRawValue = string | number | boolean | null | undefined;

export type ImpactRawRecord = Record<string, ImpactRawValue>;

export type FractionalViuTranche = ImpactRawRecord & {
  id?: string | null;
  permanent_id?: string | null;
  tranche_permanent_id?: string | null;
  fractional_tranche_permanent_id?: string | null;

  tranche_status?: string | null;
  status?: string | null;

  period_key?: string | null;
  impact_line?: string | null;
  scope_code?: string | null;
  scope_name?: string | null;

  total_viu_cents?: number | null;
  available_viu_cents?: number | null;
  allocated_viu_cents?: number | null;

  total_viu_amount?: string | number | null;
  available_viu_amount?: string | number | null;
  allocated_viu_amount?: string | number | null;

  kg_equivalent?: string | number | null;
  available_kg_equivalent?: string | number | null;
  allocated_kg_equivalent?: string | number | null;

  tranche_manifest_hash?: string | null;
  manifest_hash?: string | null;

  created_at?: string | null;
};

export type FractionalPoolData = {
  overview: ImpactRawRecord | null;
  tranches: FractionalViuTranche[];
  availableTranches: FractionalViuTranche[];
  byLine: ImpactRawRecord[];
  residualKg: ImpactRawRecord | null;
  readiness: ImpactRawRecord[];
  errorMessage: string | null;
};

export async function getFractionalPoolData(): Promise<FractionalPoolData> {
  const supabase = await createClient();

  const [
    overviewResult,
    tranchesResult,
    availableTranchesResult,
    byLineResult,
    residualKgResult,
    readinessResult,
  ] = await Promise.all([
    supabase.from("fractional_viu_pool_overview").select("*").maybeSingle(),

    supabase.from("fractional_viu_tranche_gallery").select("*").limit(100),

    supabase.from("available_fractional_viu_tranches").select("*").limit(100),

    supabase.from("fractional_viu_pool_by_line").select("*"),

    supabase.from("residual_kg_pool_overview").select("*").maybeSingle(),

    supabase.from("fractional_viu_tranche_readiness").select("*"),
  ]);

  const firstError =
    overviewResult.error ||
    tranchesResult.error ||
    availableTranchesResult.error ||
    byLineResult.error ||
    residualKgResult.error ||
    readinessResult.error;

  return {
    overview: (overviewResult.data as ImpactRawRecord | null) ?? null,
    tranches: (tranchesResult.data as FractionalViuTranche[] | null) ?? [],
    availableTranches:
      (availableTranchesResult.data as FractionalViuTranche[] | null) ?? [],
    byLine: (byLineResult.data as ImpactRawRecord[] | null) ?? [],
    residualKg: (residualKgResult.data as ImpactRawRecord | null) ?? null,
    readiness: (readinessResult.data as ImpactRawRecord[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}