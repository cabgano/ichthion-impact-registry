import Link from "next/link";
import { notFound } from "next/navigation";

import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { VerificationRecordPanel } from "@/components/impact/VerificationRecordPanel";

import {
  getClientAllocationVerificationData,
} from "@/lib/impact/verification";

import {
  getConversionHistoryData,
} from "@/lib/impact/conversions";


type AllocationVerificationPageProps = {
  params: Promise<{
    reference: string;
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
    return value as Record<string, unknown>;
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
      ): item is Record<string, unknown> =>
        item !== null
    );
}


function displayValue(
  value: unknown,
  fallback = "—"
): string {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return fallback;
}


export default async function AllocationVerificationPage({
  params,
}: AllocationVerificationPageProps) {

  const {
    reference,
  } = await params;


  const allocationReference =
    decodeURIComponent(reference);


  const {
    record,
    errorMessage,
  } =
    await getClientAllocationVerificationData(
      allocationReference
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
      record?.allocation_verification_status
    ) ??
    asString(
      record?.status
    ) ??
    (
      errorMessage
        ? "error"
        : "verified"
    );


  const allocationStatus =
    asString(
      record?.allocation_status
    );


  const clientCode =
    asString(
      record?.client_code
    );


  const clientDisplayName =
    asString(
      record?.client_display_name
    ) ??
    clientCode ??
    "Unknown client";


  const allocationManifestHash =
    asString(
      record?.allocation_manifest_hash
    );


  const allocationManifestHashMatches =
    record?.allocation_manifest_hash_matches ===
      true;


  const allocationTotalMatches =
    record?.allocation_total_matches_sources ===
      true;


  const sources =
    asRecordArray(
      record?.sources_json
    );


  const fullViuSourcesCount =
    Number(
      record?.full_viu_sources_count ??
      0
    );


  const readyFutureMintCount =
    Number(
      record
        ?.full_viu_sources_ready_for_future_mint_count ??
      0
    );


  const level2Verified =
    verificationStatus ===
      "confirmed_allocation_verified_level2" ||
    verificationStatus ===
      "issued_allocation_verified";


  /*
   * Resolve CONV permanent IDs against the
   * existing conversion history so we can
   * reuse the already implemented traceability
   * routes instead of creating duplicate routes.
   */
  const conversionHistory =
    sources.length > 0
      ? await getConversionHistoryData()
      : {
          conversions: [],
          errorMessage: null,
        };


  return (
    <>

      <ImpactPageHeader
        title={`Allocation Verification · ${allocationReference}`}
        description="Level 2 verification of the exact VIUs assigned to a client, including source impact, conversion, hashes and allocation movements."
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
            Unable to load allocation verification.
          </strong>

          <p className="mt-1">
            {errorMessage}
          </p>

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
        <>

          {/* ==================================================
              ALLOCATION VERIFICATION STAGE
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client allocation
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {clientDisplayName}
                </h2>

                {clientCode ? (
                  <p className="mt-1 text-sm text-slate-500">
                    Client code: {clientCode}
                  </p>
                ) : null}

              </div>


              <div className="flex flex-wrap gap-2">

                {allocationStatus ? (
                  <ImpactStatusPill
                    status={
                      allocationStatus
                    }
                  />
                ) : null}

                <ImpactStatusPill
                  status={
                    level2Verified
                      ? "verified"
                      : verificationStatus
                  }
                />

              </div>

            </div>


            <div className="mt-5 grid gap-3 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Level 2 verification
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    level2Verified
                      ? "Verified"
                      : "Review required"
                  }
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Allocation Manifest, exact VIU sources and assigned totals are verified independently from Future Mint.
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assigned impact
                </p>

                <p className="mt-2 text-lg font-bold text-slate-950">
                  {displayValue(
                    record.assigned_viu_amount
                  )} VIU
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {displayValue(
                    record.assigned_kg_equivalent
                  )} kg
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Future Mint
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    readyFutureMintCount > 0
                      ? `${readyFutureMintCount} / ${fullViuSourcesCount} prepared`
                      : "Not prepared yet"
                  }
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {
                    readyFutureMintCount > 0
                      ? "Future on-chain metadata exists for part or all of this allocation."
                      : "Blockchain metadata is not required for Level 2 allocation verification."
                  }
                </p>

              </div>

            </div>

          </section>


          {/* ==================================================
              ALLOCATION MANIFEST
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <h2 className="text-base font-bold text-slate-950">
                  Allocation Manifest
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Cryptographic seal of the client, exact VIUs and total impact contained in this allocation.
                </p>

              </div>

              <ImpactStatusPill
                status={
                  allocationManifestHashMatches
                    ? "verified"
                    : "review_required"
                }
              />

            </div>


            <div className="mt-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Allocation Manifest Hash
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-800">
                {
                  allocationManifestHash ??
                  "Not available"
                }
              </p>

            </div>


            <div className="mt-4 grid gap-3 md:grid-cols-2">

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Manifest integrity
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    allocationManifestHashMatches
                      ? "Hash verified"
                      : "Verification required"
                  }
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Source total
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    allocationTotalMatches
                      ? "Matches allocation"
                      : "Mismatch detected"
                  }
                </p>

              </div>

            </div>

          </section>


          {/* ==================================================
              EXACT VIU SOURCES
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div>

              <h2 className="text-base font-bold text-slate-950">
                Exact VIUs assigned
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Each card below is an exact VIU included in this allocation and preserves its traceability back to verified physical impact.
              </p>

            </div>


            <div className="mt-5 space-y-4">

              {sources.length === 0 ? (

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No confirmed or issued VIU sources were found.
                </div>

              ) : (

                sources.map(
                  (
                    source,
                    index
                  ) => {

                    const viuId =
                      asString(
                        source
                          .source_permanent_id
                      );


                    const mviId =
                      asString(
                        source
                          .source_verified_impact_permanent_id
                      );


                    const convId =
                      asString(
                        source
                          .conversion_batch_permanent_id
                      );


                    const sourceStatus =
                      asString(
                        source
                          .source_status
                      );


                    const assetManifestHash =
                      asString(
                        source
                          .asset_manifest_hash
                      );


                    const sourceManifestHash =
                      asString(
                        source
                          .source_manifest_hash
                      );


                    const sourceHashMatches =
                      source
                        .source_manifest_hash_matches ===
                      true;


                    const movement =
                      asRecord(
                        source
                          .allocation_movement
                      );


                    const movementPermanentId =
                      asString(
                        movement
                          ?.permanent_id
                      );


                    const futureOnchain =
                      asRecord(
                        source
                          .future_onchain_metadata
                      );


                    const mintId =
                      asString(
                        futureOnchain
                          ?.mint_metadata_permanent_id
                      );


                    const onchainHash =
                      asString(
                        futureOnchain
                          ?.onchain_metadata_hash
                      );


                    const conversion =
                      conversionHistory
                        .conversions
                        .find(
                          (item) =>
                            item
                              .conversionPermanentId ===
                            convId
                        ) ??
                      null;


                    const methodologyCode =
                      asString(
                        source.methodology_code
                      ) ??
                      conversion
                        ?.methodologyCode ??
                      null;


                    const methodologyVersion =
                      conversion
                        ?.methodologyVersion ??
                      null;


                    return (
                      <article
                        key={
                          viuId ??
                          String(index)
                        }
                        className="rounded-2xl border border-slate-200 p-5"
                      >

                        <div className="flex flex-wrap items-start justify-between gap-4">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              VIU source {index + 1}
                            </p>

                            <h3 className="mt-1 break-all text-lg font-bold text-slate-950">
                              {
                                viuId ??
                                "Unknown VIU"
                              }
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {displayValue(
                                source.viu_amount
                              )} VIU ·{" "}
                              {displayValue(
                                source.kg_equivalent
                              )} kg
                            </p>

                            {methodologyCode ? (
                              <p className="mt-1 text-xs font-semibold text-slate-700">
                                Methodology: {methodologyCode}
                                {methodologyVersion
                                  ? ` · v${methodologyVersion}`
                                  : ""}
                              </p>
                            ) : null}

                          </div>


                          <div className="flex flex-wrap gap-2">

                            {sourceStatus ? (
                              <ImpactStatusPill
                                status={
                                  sourceStatus
                                }
                              />
                            ) : null}

                            <ImpactStatusPill
                              status={
                                sourceHashMatches
                                  ? "verified"
                                  : "review_required"
                              }
                            />

                          </div>

                        </div>


                        {/* TRACEABILITY */}

                        <div className="mt-5">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Traceability
                          </p>


                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

                            {/* MVI */}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                              <p className="text-xs text-slate-500">
                                Verified Impact
                              </p>

                              <p className="mt-1 break-all font-semibold text-slate-950">
                                {
                                  mviId ??
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
                                      Open evidence
                                    </Link>
                                  )
                                  : null
                              }

                            </div>


                            {/* CONV */}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                              <p className="text-xs text-slate-500">
                                Conversion
                              </p>

                              <p className="mt-1 break-all font-semibold text-slate-950">
                                {
                                  convId ??
                                  "Not available"
                                }
                              </p>

                              {methodologyCode ? (
                                <p className="mt-2 text-xs font-semibold text-slate-700">
                                  {methodologyCode}
                                  {methodologyVersion
                                    ? ` · v${methodologyVersion}`
                                    : ""}
                                </p>
                              ) : null}

                              {
                                conversion
                                  ? (
                                    <Link
                                      href={`/impact/conversions/${conversion.conversionBatchId}`}
                                      className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                                    >
                                      Open conversion
                                    </Link>
                                  )
                                  : null
                              }

                            </div>


                            {/* VIU */}

                            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">

                              <p className="text-xs text-slate-500">
                                VIU
                              </p>

                              <p className="mt-1 break-all font-semibold text-slate-950">
                                {
                                  viuId ??
                                  "Not available"
                                }
                              </p>

                              {
                                viuId
                                  ? (
                                    <Link
                                      href={`/impact/verify/viu/${encodeURIComponent(
                                        viuId
                                      )}`}
                                      className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                                    >
                                      Verify VIU
                                    </Link>
                                  )
                                  : null
                              }

                            </div>


                            {/* MOV */}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                              <p className="text-xs text-slate-500">
                                Allocation MOV
                              </p>

                              <p className="mt-1 break-all font-semibold text-slate-950">
                                {
                                  movementPermanentId ??
                                  "Not available"
                                }
                              </p>

                              <p className="mt-3 text-xs text-slate-500">
                                Wallet movement generated when this exact VIU was assigned.
                              </p>

                            </div>

                          </div>

                        </div>


                        {/* HASHES */}

                        <div className="mt-5">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Integrity hashes
                          </p>


                          <div className="mt-3 grid gap-3 lg:grid-cols-2">

                            <div className="rounded-xl border border-slate-200 p-4">

                              <p className="text-xs font-semibold text-slate-500">
                                Asset Manifest Hash
                              </p>

                              <p className="mt-2 break-all font-mono text-xs text-slate-800">
                                {
                                  assetManifestHash ??
                                  "Not available"
                                }
                              </p>

                            </div>


                            <div className="rounded-xl border border-slate-200 p-4">

                              <p className="text-xs font-semibold text-slate-500">
                                Source Manifest Hash
                              </p>

                              <p className="mt-2 break-all font-mono text-xs text-slate-800">
                                {
                                  sourceManifestHash ??
                                  "Not available"
                                }
                              </p>

                              <p className="mt-2 text-xs font-semibold text-slate-600">
                                {
                                  sourceHashMatches
                                    ? "Matches Asset Manifest Hash"
                                    : "Hash mismatch / review required"
                                }
                              </p>

                            </div>

                          </div>

                        </div>


                        {/* FUTURE MINT */}

                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Future Mint
                          </p>

                          {
                            mintId || onchainHash
                              ? (
                                <>
                                  <p className="mt-2 font-semibold text-slate-950">
                                    Prepared
                                  </p>

                                  {mintId ? (
                                    <p className="mt-2 break-all text-sm text-slate-700">
                                      {mintId}
                                    </p>
                                  ) : null}

                                  {onchainHash ? (
                                    <p className="mt-2 break-all font-mono text-xs text-slate-600">
                                      {onchainHash}
                                    </p>
                                  ) : null}
                                </>
                              )
                              : (
                                <>
                                  <p className="mt-2 font-semibold text-slate-950">
                                    Not prepared yet
                                  </p>

                                  <p className="mt-1 text-sm text-slate-600">
                                    No Onchain Metadata Hash is expected at the current Level 2 allocation stage.
                                  </p>
                                </>
                              )
                          }

                        </div>

                      </article>
                    );
                  }
                )

              )}

            </div>

          </section>


          {/* ==================================================
              EXISTING VERIFICATION RECORD
              ================================================== */}

          <VerificationRecordPanel
            record={record}
            mainFields={[
              "allocation_reference",
              "allocation_status",
              "period_key",

              "client_code",
              "client_display_name",

              "assigned_viu_cents",
              "assigned_viu_amount",
              "assigned_kg_equivalent",

              "sources_count",
              "confirmed_sources_count",
              "issued_sources_count",

              "full_viu_sources_count",
              "fractional_sources_count",

              "full_viu_sources_with_mint_metadata_count",
              "full_viu_sources_ready_for_future_mint_count",

              "issued_at",
              "created_at",
            ]}
            hashFields={[
              "allocation_manifest_hash",
            ]}
            checkFields={[
              "has_allocation_manifest",
              "allocation_manifest_hash_matches",
              "allocation_total_matches_sources",
              "all_sources_issued",
              "all_full_vius_ready_for_future_mint",
              "verification_status",
            ]}
          />

        </>
      ) : null}

    </>
  );
}