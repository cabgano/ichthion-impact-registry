import type { ImpactUserPermissions } from "@/lib/impact/types";

type ImpactRoleBadgeProps = {
  permissions: ImpactUserPermissions;
};

export function ImpactRoleBadge({ permissions }: ImpactRoleBadgeProps) {
  const label =
    permissions.impact_role === "technical_admin"
      ? "Technical Admin"
      : permissions.impact_role === "impact_admin"
        ? "Impact Admin"
        : permissions.impact_role === "impact_viewer"
          ? "Impact Viewer"
          : permissions.impact_role === "sql_admin"
            ? "SQL Admin"
            : "No Role";

  const statusLabel =
    permissions.permission_status === "operational"
      ? "Operational access"
      : permissions.permission_status === "read_only"
        ? "Read-only access"
        : "No access detected";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Current role
      </p>
      <p className="mt-1 text-sm font-bold text-slate-950">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
    </div>
  );
}