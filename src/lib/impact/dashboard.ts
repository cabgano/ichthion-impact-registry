import { createClient } from "@/lib/supabase/server";

export type ImpactWalletDashboardOverview = {
  control_status: string | null;

  verified_kg_balance: number | string | null;

  spendable_viu_cents_balance: number | null;
  spendable_viu_balance: number | string | null;
  spendable_kg_equivalent: number | string | null;

  residual_kg_balance: number | string | null;

  assigned_viu_cents_balance: number | null;
  assigned_viu_balance: number | string | null;
  assigned_kg_equivalent: number | string | null;

  total_controlled_kg: number | string | null;
  total_controlled_viu_equivalent: number | string | null;

  available_viu_cards_count: number | null;
  allocated_viu_cards_count: number | null;

  available_fractional_tranches_count: number | null;
  allocated_fractional_tranches_count: number | null;

  verified_impacts_pending_conversion_count: number | null;
  kg_pending_conversion: number | string | null;

  conversion_batches_pending_asset_generation_count: number | null;

  generated_at: string | null;
};

export type ImpactWalletDashboardByLine = {
  impact_line: string | null;
  verified_kg_balance: number | string | null;
  spendable_viu_cents_balance: number | null;
  spendable_viu_balance: number | string | null;
  spendable_kg_equivalent: number | string | null;
  residual_kg_balance: number | string | null;
  assigned_viu_cents_balance: number | null;
  assigned_viu_balance: number | string | null;
  assigned_kg_equivalent: number | string | null;
  available_viu_cards_count: number | null;
  available_fractional_tranches_count: number | null;
};

export type ImpactWalletDashboardAlert = {
  alert_code: string;
  severity: string;
  message: string;
};

export type ImpactWalletRecentActivity = {
  permanent_id: string;
  created_at: string | null;
  movement_type: string | null;
  period_key: string | null;
  impact_line: string | null;
  scope_code: string | null;
  scope_name: string | null;
  source_type: string | null;
  source_permanent_id: string | null;
  verified_kg_balance_delta: number | string | null;
  spendable_viu_cents_delta: number | null;
  spendable_viu_delta: number | string | null;
  residual_kg_delta: number | string | null;
  assigned_viu_cents_delta: number | null;
  assigned_viu_delta: number | string | null;
  notes: string | null;
};

export type ImpactDashboardData = {
  overview: ImpactWalletDashboardOverview | null;
  byLine: ImpactWalletDashboardByLine[];
  alerts: ImpactWalletDashboardAlert[];
  recentActivity: ImpactWalletRecentActivity[];
  errorMessage: string | null;
};

export async function getImpactDashboardData(): Promise<ImpactDashboardData> {
  const supabase = await createClient();

  const [
    overviewResult,
    byLineResult,
    alertsResult,
    recentActivityResult,
  ] = await Promise.all([
    supabase
      .from("impact_wallet_dashboard_overview")
      .select("*")
      .maybeSingle(),

    supabase
      .from("impact_wallet_dashboard_by_line")
      .select("*")
      .order("impact_line", { ascending: true }),

    supabase
      .from("impact_wallet_dashboard_alerts")
      .select("*")
      .order("severity", { ascending: false })
      .order("alert_code", { ascending: true }),

    supabase
      .from("impact_wallet_dashboard_recent_activity")
      .select("*")
      .limit(8),
  ]);

  const firstError =
    overviewResult.error ||
    byLineResult.error ||
    alertsResult.error ||
    recentActivityResult.error;

  return {
    overview:
      (overviewResult.data as ImpactWalletDashboardOverview | null) ?? null,
    byLine: (byLineResult.data as ImpactWalletDashboardByLine[] | null) ?? [],
    alerts: (alertsResult.data as ImpactWalletDashboardAlert[] | null) ?? [],
    recentActivity:
      (recentActivityResult.data as ImpactWalletRecentActivity[] | null) ?? [],
    errorMessage: firstError?.message ?? null,
  };
}