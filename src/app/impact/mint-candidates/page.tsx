import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactPlaceholder } from "@/components/impact/ImpactPlaceholder";

export default function ImpactMintCandidatesPage() {
  return (
    <>
      <ImpactPageHeader
        title="Future Mint Candidates"
        description="VIUs completas asignadas que ya tienen metadata futura on-chain preparada."
      />

      <ImpactPlaceholder
        title="Future mint candidates pending"
        description="Esta pantalla mostrará MINT records como MINT-202607-000001 y su relación con VIU y cliente."
        dataSource="public.assigned_viu_mint_candidates"
      />
    </>
  );
}