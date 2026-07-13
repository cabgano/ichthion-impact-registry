import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

export default function ImpactFractionsPage() {
  return (
    <>
      <ImpactPageHeader
        title="Fractional Pool"
        description="Pool de FVIUs, cent_VIUs disponibles y kg residuales no asignables directamente."
      />

      <ImpactPlaceholder
        title="Fractional pool pending"
        description="Esta pantalla mostrará FVIU tranches, cent_VIUs disponibles y kg residuales."
        dataSource="public.fractional_viu_pool_overview + public.fractional_viu_tranche_gallery"
      />
    </>
  );
}