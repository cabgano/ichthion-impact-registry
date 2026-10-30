
import Image from "next/image";
import type { ReactNode } from "react";
import { PortalDocumentsSyncPanel } from "./PortalDocumentsSyncPanel";

import { ImpactNav } from "./ImpactNav";
import { ImpactRoleBadge } from "./ImpactRoleBadge";
import { ImpactPermissionBanner } from "./ImpactPermissionBanner";
import { LogoutButton } from "./LogoutButton";
import { PortalShadowSyncPanel } from "./PortalShadowSyncPanel";

import { getCurrentImpactUserPermissions } from "@/lib/impact/permissions";

type ImpactShellProps = {
  children: ReactNode;
};

export async function ImpactShell({
  children,
}: ImpactShellProps) {
  const permissions =
    await getCurrentImpactUserPermissions();

  const canManagePortalShadow =
    permissions.impact_role ===
      "technical_admin" ||
    permissions.impact_role ===
      "impact_admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-[calc(100vh-3rem)]">
          <div>
            {/* Ichthion Branding */}
            <div className="mb-5 flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Ichthion Logo"
                width={72}
                height={72}
                priority
                className="h-[72px] w-[72px] shrink-0 object-contain"
              />

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Ichthion
                </p>

                <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-950">
                  Impact Registry
                </h1>

                <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                  VIU Wallet · Level 2
                </p>
              </div>
            </div>

            <div className="mb-4">
              <ImpactRoleBadge
                permissions={permissions}
              />
            </div>

            <ImpactNav
              permissions={permissions}
            />

            <LogoutButton />
          </div>

          {canManagePortalShadow && (
            <div className="mt-12 lg:mt-auto lg:pt-12">
              <PortalShadowSyncPanel />

              <div className="mt-5">
              <PortalDocumentsSyncPanel />
              </div>
            </div>
          )}
        </aside>

        <main className="min-w-0">
          <ImpactPermissionBanner
            permissions={permissions}
          />

          {children}
        </main>
      </div>
    </div>
  );
}
