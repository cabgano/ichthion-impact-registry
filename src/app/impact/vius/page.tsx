import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

export default function ImpactViusPage() {
  return (
    <>
      <ImpactPageHeader
        title="VIU Cards"
        description="Galería interna de tarjetas VIU completas. Aquí veremos disponibles, asignadas y listas para futuro mint."
      />

      <ImpactPlaceholder
        title="VIU card gallery pending"
        description="Esta pantalla consumirá la vista de tarjetas VIU completas."
        dataSource="public.viu_asset_card_gallery"
      />
    </>
  );
}