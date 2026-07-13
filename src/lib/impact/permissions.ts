import { createClient } from "@/lib/supabase/server";
import type { ImpactUserPermissions } from "@/lib/impact/types";

const fallbackPermissions: ImpactUserPermissions = {
  current_auth_uid: null,
  impact_role: "no_session_or_role",
  can_read: false,
  can_operate_impact: false,
  can_verify_evidence: false,
  can_import_kg: false,
  can_convert_kg_to_viu: false,
  can_generate_assets: false,
  can_create_allocations: false,
  can_confirm_allocations: false,
  can_prepare_onchain_metadata: false,
  can_issue_allocations: false,
  can_manage_users: false,
  permission_status: "no_role_detected",
  error_message: null,
};

export async function getCurrentImpactUserPermissions(): Promise<ImpactUserPermissions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("current_impact_user_permissions")
    .maybeSingle();

  if (error || !data) {
    return {
      ...fallbackPermissions,
      error_message: error?.message ?? "No authenticated impact role detected.",
    };
  }

  const canOperate = Boolean(data.can_operate_impact);
  const canRead = Boolean(data.can_read);

  return {
    current_auth_uid: data.current_auth_uid ?? null,
    impact_role: data.impact_role ?? "no_session_or_role",

    can_read: canRead,
    can_operate_impact: canOperate,
    can_verify_evidence: Boolean(data.can_verify_evidence),
    can_import_kg: Boolean(data.can_import_kg),
    can_convert_kg_to_viu: Boolean(data.can_convert_kg_to_viu),
    can_generate_assets: Boolean(data.can_generate_assets),
    can_create_allocations: Boolean(data.can_create_allocations),
    can_confirm_allocations: Boolean(data.can_confirm_allocations),
    can_prepare_onchain_metadata: Boolean(data.can_prepare_onchain_metadata),
    can_issue_allocations: Boolean(data.can_issue_allocations),
    can_manage_users: Boolean(data.can_manage_users),

    permission_status: canOperate
      ? "operational"
      : canRead
        ? "read_only"
        : "no_role_detected",

    error_message: null,
  };
}