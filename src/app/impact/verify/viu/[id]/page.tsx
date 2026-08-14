import Link from "next/link";
import { notFound } from "next/navigation";

import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { VerificationRecordPanel } from "@/components/impact/VerificationRecordPanel";

import {
  getClientAllocationVerificationData,
  getViuAssetVerificationData,
} from "@/lib/impact/verification";

import {
  getConversionHistoryData,
} from "@/lib/impact/conversions";


type ViuVerificationPageProps = {
  params: Promise<{
    id: string;
  }>;
};


function asString(
  value: unknown
): string | null {
  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    return value;
  }

  return null;
}


function asRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return null;
}


function asRecordArray(
  value: unknown
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(asRecord)
    .filter(
      (
        item
      ): item is Record<
        string,
        unknown
      > => item !== null
    );
}


export default async function ViuVerificationPage({
  params,
}: ViuVerificationPageProps) {

  const {
    id,
  } = await params;

  const viuId =
    decodeURIComponent(id);


  const {
    record,
    errorMessage,
  } =
    await getViuAssetVerificationData(
      viuId
    );


  if (
    !record &&
    !errorMessage
  ) {
    notFound();
  }


  const verificationStatus =
    asString(
      record?.verification_status
    ) ??
    asString(
      record?.asset_verification_status
    ) ??
    asString(
      record?.status
    ) ??
    (
      errorMessage
        ? "error"
        : "verified"
    );


  const conversionPermanentId =
    asString(
      record
        ?.conversion_batch_permanent_id
    );


  const sourceVerifiedImpactPermanentId =
    asString(
      record
        ?.source_verified_impact_permanent_id
    );


  const allocationReference =
    asString(
      record
        ?.allocation_reference
    );


  const allocationStatus =
    asString(
      record
        ?.allocation_status
    );


  const clientCode =
    asString(
      record
        ?.client_code
    );


  const clientDisplayName =
    asString(
      record
        ?.client_display_name
    ) ??
    clientCode;


  const mintMetadataPermanentId =
    asString(
      record
        ?.mint_metadata_permanent_id
    );


  const onchainMetadataHash =
    asString(
      record
        ?.onchain_metadata_hash
    );


  /*
   * Resolve existing conversion history so that
   * permanent traceability IDs can become
   * navigable links to the existing CONV and
   * evidence pages.
   */
  const conversionHistory =
    conversionPermanentId
      ? await getConversionHistoryData()
      : {
          conversions: [],
          errorMessage: null,
        };


  const conversion =
    conversionHistory
      .conversions
      .find(
        (item) =>
          item.conversionPermanentId ===
          conversionPermanentId
      ) ??
    null;


  /*
   * The allocation verification RPC already
   * exposes the MOV attached to each exact VIU.
   * We use it here only to complete the visible
   * traceability chain.
   */
  let allocationMovementId:
    | string
    | null = null;


  if (
    allocationReference
  ) {

    const allocationVerification =
      await getClientAllocationVerificationData(
        allocationReference
      );


    const allocationSources =
      asRecordArray(
        allocationVerification
          .record
          ?.sources_json
      );


    const currentSource =
      allocationSources.find(
        (source) =>
          asString(
            source
              .source_permanent_id
          ) === viuId
      );


    const movement =
      asRecord(
        currentSource
          ?.allocation_movement
      );


    allocationMovementId =
      asString(
        movement?.permanent_id
      );
  }


  const level2Verified =
    verificationStatus ===
      "assigned_asset_verified_level2" ||
    verificationStatus ===
      "assigned_asset_verified_ready_for_future_mint";


  const futureMintPrepared =
    Boolean(
      mintMetadataPermanentId ||
      onchainMetadataHash
    );


  return (
    <>

      <ImpactPageHeader
        title={`VIU Verification · ${viuId}`}
        description="Level 2 verification for a full VIU, including source impact, conversion and client allocation traceability."
      >
        <ImpactStatusPill
          status={
            String(
              verificationStatus
            )
          }
        />
      </ImpactPageHeader>


      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">

          <strong>
            Unable to load VIU verification.
          </strong>

          <p className="mt-1">
            {errorMessage}
          </p>

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
        <>

          {/* ==================================================
              LEVEL 2 VERIFICATION STAGE
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <h2 className="text-base font-bold text-slate-950">
                  Verification stage
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Level 2 integrity and the future blockchain preparation stage are verified independently.
                </p>

              </div>

              <ImpactStatusPill
                status={
                  level2Verified
                    ? "verified"
                    : String(
                        verificationStatus
                      )
                }
              />

            </div>


            <div className="mt-4 grid gap-3 md:grid-cols-2">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Level 2 allocation verification
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    level2Verified
                      ? "Verified"
                      : "Review required"
                  }
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Asset, source and allocation integrity are evaluated without requiring blockchain metadata.
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Future Mint
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    futureMintPrepared
                      ? "Prepared"
                      : "Not prepared yet"
                  }
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {
                    futureMintPrepared
                      ? "Future on-chain metadata exists for this VIU."
                      : "Onchain Metadata Hash is not required at the current Level 2 allocation stage."
                  }
                </p>

              </div>

            </div>

          </section>


          {/* ==================================================
              TRACEABILITY CHAIN
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div>

              <h2 className="text-base font-bold text-slate-950">
                Impact traceability chain
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Follow this VIU from verified physical impact through conversion and client allocation.
              </p>

            </div>


            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              {/* MVI */}

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  1 · Verified Impact
                </p>

                <p className="mt-2 break-all font-semibold text-slate-950">
                  {
                    sourceVerifiedImpactPermanentId ??
                    "Not available"
                  }
                </p>

                {
                  conversion
                    ? (
                      <Link
                        href={`/impact/evidence/${conversion.evidencePackageId}`}
                        className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                      >
                        Open evidence package
                      </Link>
                    )
                    : null
                }

              </div>


              {/* CONV */}

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  2 · Conversion
                </p>

                <p className="mt-2 break-all font-semibold text-slate-950">
                  {
                    conversionPermanentId ??
                    "Not available"
                  }
                </p>

                {
                  conversion
                    ? (
                      <Link
                        href={`/impact/conversions/${conversion.conversionBatchId}`}
                        className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                      >
                        Open conversion traceability
                      </Link>
                    )
                    : null
                }

              </div>


              {/* VIU */}

              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  3 · VIU
                </p>

                <p className="mt-2 break-all font-bold text-slate-950">
                  {viuId}
                </p>

                <p className="mt-3 text-sm text-slate-600">
                  Current verified asset
                </p>

              </div>


              {/* ALLOC */}

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  4 · Allocation
                </p>

                <p className="mt-2 break-all font-semibold text-slate-950">
                  {
                    allocationReference ??
                    "Not allocated"
                  }
                </p>

                {
                  allocationReference
                    ? (
                      <Link
                        href={`/impact/verify/allocation/${encodeURIComponent(
                          allocationReference
                        )}`}
                        className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                      >
                        Open allocation verification
                      </Link>
                    )
                    : null
                }

              </div>


              {/* CLIENT + MOV */}

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  5 · Client / MOV
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    clientDisplayName ??
                    "Not allocated"
                  }
                </p>

                {
                  clientCode
                    ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Client code: {clientCode}
                      </p>
                    )
                    : null
                }

                {
                  allocationMovementId
                    ? (
                      <p className="mt-3 break-all font-mono text-xs text-slate-700">
                        {allocationMovementId}
                      </p>
                    )
                    : null
                }

                {
                  allocationStatus
                    ? (
                      <div className="mt-3">
                        <ImpactStatusPill
                          status={
                            allocationStatus
                          }
                        />
                      </div>
                    )
                    : null
                }

              </div>

            </div>

          </section>


          {/* ==================================================
              EXISTING VERIFICATION RECORD
              ================================================== */}

          <VerificationRecordPanel
            record={record}
            mainFields={[
              "viu_asset_permanent_id",
              "asset_status",
              "period_key",
              "impact_line",
              "scope_code",
              "scope_name",
              "viu_cents",
              "viu_amount",
              "kg_equivalent",

              "source_verified_impact_permanent_id",
              "conversion_batch_permanent_id",

              "client_code",
              "client_display_name",

              "allocation_reference",
              "allocation_status",
              "allocation_source_status",

              "tokenization_status",
              "future_token_id",
              "mint_readiness_status",
              "onchain_status",
            ]}
            hashFields={[
              "asset_manifest_hash",
              "source_manifest_hash",
              "allocation_manifest_hash",
              "onchain_metadata_hash",
            ]}
            checkFields={[
              "has_base_manifest",
              "base_manifest_hash_matches",
              "allocation_manifest_hash_matches",
              "onchain_metadata_hash_matches",
              "verification_status",
            ]}
          />

        </>
      ) : null}

    </>
  );
}