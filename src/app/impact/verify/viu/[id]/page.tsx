import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

type VerifyViuPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VerifyViuPage({ params }: VerifyViuPageProps) {
  const { id } = await params;

  return (
    <>
      <ImpactPageHeader
        title={`VIU Verification · ${id}`}
        description="Página lógica de verificación de una VIU Asset específica."
      />

      <ImpactPlaceholder
        title="VIU verification detail pending"
        description={`Aquí mostraremos la verificación completa de ${id}.`}
        dataSource="public.get_viu_asset_verification_page(id)"
      />
    </>
  );
}