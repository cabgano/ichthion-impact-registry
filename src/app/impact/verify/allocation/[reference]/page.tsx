import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

type VerifyAllocationPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function VerifyAllocationPage({
  params,
}: VerifyAllocationPageProps) {
  const { reference } = await params;

  return (
    <>
      <ImpactPageHeader
        title={`Allocation Verification · ${reference}`}
        description="Página lógica de verificación de una asignación emitida."
      />

      <ImpactPlaceholder
        title="Allocation verification detail pending"
        description={`Aquí mostraremos la verificación completa de ${reference}.`}
        dataSource="public.get_client_allocation_verification_page(reference)"
      />
    </>
  );
}