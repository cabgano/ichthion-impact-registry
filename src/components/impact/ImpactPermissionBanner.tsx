import type { ImpactUserPermissions } from "@/lib/impact/types";

type ImpactPermissionBannerProps = {
  permissions: ImpactUserPermissions;
};

export function ImpactPermissionBanner({
  permissions,
}: ImpactPermissionBannerProps) {
  if (permissions.permission_status === "operational") {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <strong>Operational access enabled.</strong> Este usuario puede ver y operar el Impact Registry.
      </div>
    );
  }

  if (permissions.permission_status === "read_only") {
    return (
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Read-only access.</strong> Este usuario puede consultar la información, pero no puede ejecutar acciones operativas.
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      <strong>No authenticated impact role detected.</strong> En desarrollo puedes seguir viendo placeholders, pero los datos reales requerirán sesión y rol válido.
      {permissions.error_message ? (
        <p className="mt-2 text-xs text-slate-500">{permissions.error_message}</p>
      ) : null}
    </div>
  );
}