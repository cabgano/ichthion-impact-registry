import Link from "next/link";
import { notFound } from "next/navigation";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { VerificationRecordPanel } from "@/components/impact/VerificationRecordPanel";
import { getViuAssetVerificationData } from "@/lib/impact/verification";

type ViuVerificationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ViuVerificationPage({
  params,
}: ViuVerificationPageProps) {
  const { id } = await params;
  const viuId = decodeURIComponent(id);

  const { record, errorMessage } = await getViuAssetVerificationData(viuId);

  if (!record && !errorMessage) {
    notFound();
  }

  const verificationStatus =
    record?.verification_status ??
    record?.asset_verification_status ??
    record?.status ??
    (errorMessage ? "error" : "verified");

  return (
    <>
      <ImpactPageHeader
        title={`VIU Verification · ${viuId}`}
        description="Página verificable Level 2 para una tarjeta VIU completa."
      >
        <ImpactStatusPill status={String(verificationStatus)} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudo cargar la verificación de esta VIU.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/impact/vius"
          className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to VIU Cards
        </Link>

        <Link
          href="/impact/mint-candidates"
          className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Future Mint Candidates
        </Link>
      </div>

      {record ? (
        <VerificationRecordPanel
          record={record}
          mainFields={[
            "viu_asset_permanent_id",
            "permanent_id",
            "asset_status",
            "period_key",
            "impact_line",
            "scope_code",
            "scope_name",
            "viu_cents",
            "viu_amount",
            "kg_equivalent",
            "client_code",
            "client_name",
            "allocation_reference",
            "tokenization_status",
            "future_token_id",
            "mint_readiness_status",
            "onchain_status",
          ]}
          hashFields={[
            "asset_manifest_hash",
            "recalculated_asset_manifest_hash",
            "source_manifest_hash",
            "allocation_manifest_hash",
            "onchain_metadata_hash",
            "metadata_hash",
          ]}
          checkFields={[
            "hash_matches",
            "asset_hash_matches",
            "manifest_hash_matches",
            "allocation_hash_matches",
            "metadata_hash_matches",
            "is_assigned",
            "is_available",
            "is_token_ready",
            "is_ready_for_future_mint",
            "verification_status",
          ]}
        />
      ) : null}
    </>
  );
}