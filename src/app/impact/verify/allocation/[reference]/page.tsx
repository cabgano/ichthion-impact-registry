import Link from "next/link";
import { notFound } from "next/navigation";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { VerificationRecordPanel } from "@/components/impact/VerificationRecordPanel";
import { getClientAllocationVerificationData } from "@/lib/impact/verification";

type AllocationVerificationPageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function AllocationVerificationPage({
  params,
}: AllocationVerificationPageProps) {
  const { reference } = await params;
  const allocationReference = decodeURIComponent(reference);

  const { record, errorMessage } =
    await getClientAllocationVerificationData(allocationReference);

  if (!record && !errorMessage) {
    notFound();
  }

  const verificationStatus =
    record?.verification_status ??
    record?.allocation_verification_status ??
    record?.status ??
    (errorMessage ? "error" : "verified");

  return (
    <>
      <ImpactPageHeader
        title={`Allocation Verification · ${allocationReference}`}
        description="Página verificable Level 2 para una asignación emitida a cliente."
      >
        <ImpactStatusPill status={String(verificationStatus)} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudo cargar la verificación de esta asignación.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/impact/allocations"
          className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Allocations
        </Link>

        <Link
          href="/impact/vius"
          className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          VIU Cards
        </Link>
      </div>

      {record ? (
        <VerificationRecordPanel
          record={record}
          mainFields={[
            "allocation_reference",
            "permanent_id",
            "allocation_status",
            "status",
            "client_code",
            "client_name",
            "total_viu_cents",
            "total_viu_amount",
            "viu_amount",
            "kg_equivalent",
            "source_count",
            "sources_count",
            "issued_at",
            "created_at",
          ]}
          hashFields={[
            "allocation_manifest_hash",
            "recalculated_allocation_manifest_hash",
            "manifest_hash",
            "source_manifest_hashes",
            "asset_manifest_hashes",
            "onchain_metadata_hashes",
          ]}
          checkFields={[
            "hash_matches",
            "allocation_hash_matches",
            "manifest_hash_matches",
            "sources_total_matches",
            "sources_are_issued",
            "has_sources",
            "is_issued",
            "verification_status",
          ]}
        />
      ) : null}
    </>
  );
}