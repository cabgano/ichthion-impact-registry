import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

export default function ImpactAllocationsPage() {
  return (
    <>
      <ImpactPageHeader
        title="Issued Allocations"
        description="Asignaciones internas emitidas y verificables para clientes."
      />

      <ImpactPlaceholder
        title="Issued allocations pending"
        description="Esta pantalla mostrará asignaciones emitidas, hashes, cliente, fuentes y estado verificable."
        dataSource="public.issued_client_allocations + public.client_allocation_verification_page"
      />
    </>
  );
}