"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { impactNavItems } from "@/lib/impact/navigation";
import type { ImpactUserPermissions } from "@/lib/impact/types";

type ImpactNavProps = {
  permissions: ImpactUserPermissions;
};

export function ImpactNav({
  permissions,
}: ImpactNavProps) {
  const pathname = usePathname();

  const visibleNavItems =
    impactNavItems.filter((item) => {
      if (item.access === "operate") {
        return permissions.can_operate_impact;
      }

      return permissions.can_read;
    });

  return (
    <nav className="flex flex-col gap-2">
      {visibleNavItems.map((item) => {
        const isActive =
          item.href === "/impact"
            ? pathname === "/impact"
            : pathname.startsWith(
                item.href
              );

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-xl border px-4 py-3 text-sm transition",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <div className="font-semibold">
              {item.label}
            </div>

            <div
              className={
                isActive
                  ? "text-slate-200"
                  : "text-slate-500"
              }
            >
              {item.description}
            </div>
          </Link>
        );
      })}

      {permissions.permission_status ===
      "read_only" ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Viewer mode: actions disabled.
        </div>
      ) : null}
    </nav>
  );
}