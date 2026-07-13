import Link from "next/link";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";
import { impactNavItems } from "@/lib/impact/navigation";

export default function ImpactHomePage() {
  return (
    <>
      <ImpactPageHeader
        title="Wallet Overview"
        description="Pantalla principal del Impact Registry. En el siguiente mini-hito conectaremos esta página con la vista impact_wallet_dashboard_overview."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {impactNavItems
          .filter((item) => item.href !== "/impact")
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-950">{item.label}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {item.description}
              </p>
            </Link>
          ))}
      </div>

      <div className="mt-6">
        <ImpactPlaceholder
          title="Dashboard data pending"
          description="Aquí mostraremos VIUs disponibles, VIUs asignadas, FVIUs, kg residuales y estado de control."
          dataSource="public.impact_wallet_dashboard_overview"
        />
      </div>
    </>
  );
}