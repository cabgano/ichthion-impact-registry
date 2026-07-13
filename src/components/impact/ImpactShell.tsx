import type { ReactNode } from "react";
import { ImpactNav } from "./ImpactNav";
import { ImpactRoleBadge } from "./ImpactRoleBadge";
import { ImpactPermissionBanner } from "./ImpactPermissionBanner";
import { getCurrentImpactUserPermissions } from "@/lib/impact/permissions";

type ImpactShellProps = {
  children: ReactNode;
};

export async function ImpactShell({ children }: ImpactShellProps) {
  const permissions = await getCurrentImpactUserPermissions();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ichthion
            </p>
            <h1 className="text-xl font-bold text-slate-950">
              Impact Registry
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              VIU Wallet · Level 2
            </p>
          </div>

          <div className="mb-4">
            <ImpactRoleBadge permissions={permissions} />
          </div>

          <ImpactNav permissions={permissions} />
        </aside>

        <main className="min-w-0">
          <ImpactPermissionBanner permissions={permissions} />
          {children}
        </main>
      </div>
    </div>
  );
}