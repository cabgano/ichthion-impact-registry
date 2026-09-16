export type ImpactRole =
  | "technical_admin"
  | "impact_admin"
  | "impact_viewer"
  | "sql_admin"
  | "no_session_or_role";

export type ImpactUserPermissions = {
  current_auth_uid: string | null;
  impact_role: ImpactRole;
  can_read: boolean;
  can_operate_impact: boolean;
  can_verify_evidence: boolean;
  can_import_kg: boolean;
  can_convert_kg_to_viu: boolean;
  can_generate_assets: boolean;
  can_create_allocations: boolean;
  can_confirm_allocations: boolean;
  can_prepare_onchain_metadata: boolean;
  can_issue_allocations: boolean;
  can_manage_users: boolean;
  permission_status: "operational" | "read_only" | "no_role_detected";
  error_message?: string | null;
};