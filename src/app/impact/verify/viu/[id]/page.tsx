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


const BASE_SEPOLIA_EXPLORER =
  "https://sepolia.basescan.org";


function asString(
  value: unknown
): string | null {
  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return String(value);
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


function shortenValue(
  value: string | null,
  start = 14,
  end = 10
) {
  if (!value) {
    return "Not available";
  }

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start
  )}...${value.slice(-end)}`;
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


  const mintReadinessStatus =
    asString(
      record
        ?.mint_readiness_status
    );


  const onchainStatus =
    asString(
      record
        ?.onchain_status
    );


  const onchainMetadataHash =
    asString(
      record
        ?.onchain_metadata_hash
    );


  /*
   * Confirmed blockchain identity.
   */
  const chainId =
    asString(
      record?.chain_id
    );


  const contractAddress =
    asString(
      record?.contract_address
    );


  const tokenId =
    asString(
      record?.token_id
    );


  const tokenUri =
    asString(
      record?.token_uri
    );


  const tokenTxHash =
    asString(
      record?.token_tx_hash
    );


  const walletAddress =
    asString(
      record?.wallet_address
    );


  const onchainVerified =
    verificationStatus ===
      "assigned_asset_onchain_verified" &&
    mintReadinessStatus ===
      "minted_on_chain" &&
    onchainStatus ===
      "minted";


  const level2Verified =
    verificationStatus ===
      "assigned_asset_verified_level2" ||
    verificationStatus ===
      "assigned_asset_verified_ready_for_future_mint" ||
    verificationStatus ===
      "assigned_asset_onchain_verified";


  const futureMintPrepared =
    Boolean(
      mintMetadataPermanentId ||
      onchainMetadataHash
    );


  const usesBaseSepolia =
    chainId === "84532";


  const transactionExplorerHref =
    usesBaseSepolia &&
    tokenTxHash
      ? `${BASE_SEPOLIA_EXPLORER}/tx/${tokenTxHash}`
      : null;


  const contractExplorerHref =
    usesBaseSepolia &&
    contractAddress
      ? `${BASE_SEPOLIA_EXPLORER}/address/${contractAddress}`
      : null;


  const walletExplorerHref =
    usesBaseSepolia &&
    walletAddress
      ? `${BASE_SEPOLIA_EXPLORER}/address/${walletAddress}`
      : null;


  const tokenExplorerHref =
    usesBaseSepolia &&
    contractAddress &&
    tokenId
      ? `${BASE_SEPOLIA_EXPLORER}/token/${contractAddress}?a=${tokenId}`
      : null;


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


  const methodologyCode =
    conversion
      ?.methodologyCode ??
    asString(
      record?.methodology_code
    );


  const methodologyVersion =
    conversion
      ?.methodologyVersion ??
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


  return (
    <>

      <ImpactPageHeader
        title={`VIU Verification · ${viuId}`}
        description="Full VIU integrity verification from physical impact and conversion through client allocation, future mint preparation and confirmed blockchain identity."
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
          VIU Mint Candidates
        </Link>

      </div>


      {record ? (
        <>

          {/* ==================================================
              VERIFICATION STAGE
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div className="flex flex-wrap items-start justify-between gap-4">

              <div>

                <h2 className="text-base font-bold text-slate-950">
                  Verification stage
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Physical impact, allocation integrity and blockchain lifecycle are verified as consecutive layers of the same VIU.
                </p>

              </div>

              <ImpactStatusPill
                status={
                  onchainVerified ||
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
                  Asset, source and allocation integrity remain verified independently from blockchain execution.
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {
                    onchainVerified
                      ? "Blockchain"
                      : "Future Mint"
                  }
                </p>

                <p className="mt-2 font-semibold text-slate-950">
                  {
                    onchainVerified
                      ? "Verified"
                      : futureMintPrepared
                        ? "Prepared"
                        : "Not prepared yet"
                  }
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {
                    onchainVerified
                      ? "This VIU has a confirmed and persisted on-chain identity."
                      : futureMintPrepared
                        ? "Future on-chain metadata exists for this VIU and it is ready for the blockchain lifecycle."
                        : "On-chain metadata has not yet been prepared for this VIU."
                  }
                </p>

                {
                  onchainVerified
                    ? (
                      <div className="mt-3">
                        <ImpactStatusPill
                          status="minted"
                        />
                      </div>
                    )
                    : mintReadinessStatus
                      ? (
                        <div className="mt-3">
                          <ImpactStatusPill
                            status={
                              mintReadinessStatus
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
              TRACEABILITY CHAIN
              ================================================== */}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

            <div>

              <h2 className="text-base font-bold text-slate-950">
                Impact traceability chain
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Follow this VIU from verified physical impact through conversion, client allocation and blockchain representation.
              </p>

            </div>


            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">

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

                {methodologyCode ? (
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Methodology: {methodologyCode}
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

                {methodologyCode ? (
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Generated under {methodologyCode}
                    {methodologyVersion
                      ? ` · v${methodologyVersion}`
                      : ""}
                  </p>
                ) : null}

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


              {/* BLOCKCHAIN / FUTURE MINT */}

              <div
                className={
                  onchainVerified
                    ? "rounded-xl border border-slate-300 bg-slate-50 p-4"
                    : "rounded-xl border border-slate-200 p-4"
                }
              >

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {
                    onchainVerified
                      ? "6 · Blockchain"
                      : "6 · Future Mint"
                  }
                </p>

                <p className="mt-2 break-all font-semibold text-slate-950">
                  {
                    onchainVerified
                      ? "On-chain verified"
                      : futureMintPrepared
                        ? "Prepared"
                        : "Not prepared"
                  }
                </p>

                {
                  onchainVerified
                    ? (
                      <>
                        <p className="mt-2 text-xs text-slate-500">
                          Base Sepolia
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-700">
                          Chain {chainId}
                        </p>

                        <p
                          className="mt-2 break-all font-mono text-xs text-slate-700"
                          title={
                            tokenId ??
                            undefined
                          }
                        >
                          Token: {
                            shortenValue(
                              tokenId,
                              10,
                              8
                            )
                          }
                        </p>

                        <div className="mt-3">
                          <ImpactStatusPill
                            status="minted"
                          />
                        </div>
                      </>
                    )
                    : (
                      <>
                        {
                          mintMetadataPermanentId
                            ? (
                              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                                {mintMetadataPermanentId}
                              </p>
                            )
                            : null
                        }

                        {
                          mintReadinessStatus
                            ? (
                              <div className="mt-3">
                                <ImpactStatusPill
                                  status={
                                    mintReadinessStatus
                                  }
                                />
                              </div>
                            )
                            : null
                        }
                      </>
                    )
                }

              </div>

            </div>

          </section>


          {/* ==================================================
              BLOCKCHAIN VERIFICATION
              ================================================== */}

          {
            onchainVerified
              ? (
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <h2 className="text-base font-bold text-slate-950">
                        Blockchain verification
                      </h2>

                      <p className="mt-1 text-sm text-slate-600">
                        Confirmed blockchain identity associated with this canonical VIU Digital Asset.
                      </p>

                    </div>

                    <ImpactStatusPill
                      status="verified"
                    />

                  </div>


                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Network
                      </p>

                      <p className="mt-2 font-semibold text-slate-950">
                        {
                          usesBaseSepolia
                            ? "Base Sepolia"
                            : `Chain ${chainId}`
                        }
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-600">
                        Chain ID: {chainId}
                      </p>
                    </div>


                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Contract
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs font-semibold text-slate-800"
                        title={
                          contractAddress ??
                          undefined
                        }
                      >
                        {
                          shortenValue(
                            contractAddress
                          )
                        }
                      </p>

                      {
                        contractExplorerHref
                          ? (
                            <a
                              href={
                                contractExplorerHref
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                            >
                              Open contract
                            </a>
                          )
                          : null
                      }
                    </div>


                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Token ID
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs font-semibold text-slate-800"
                        title={
                          tokenId ??
                          undefined
                        }
                      >
                        {
                          shortenValue(
                            tokenId,
                            20,
                            14
                          )
                        }
                      </p>

                      {
                        tokenExplorerHref
                          ? (
                            <a
                              href={
                                tokenExplorerHref
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                            >
                              Open token
                            </a>
                          )
                          : null
                      }
                    </div>


                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mint transaction
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs font-semibold text-slate-800"
                        title={
                          tokenTxHash ??
                          undefined
                        }
                      >
                        {
                          shortenValue(
                            tokenTxHash
                          )
                        }
                      </p>

                      {
                        transactionExplorerHref
                          ? (
                            <a
                              href={
                                transactionExplorerHref
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                            >
                              Open transaction
                            </a>
                          )
                          : null
                      }
                    </div>


                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mint recipient / Wallet
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs font-semibold text-slate-800"
                        title={
                          walletAddress ??
                          undefined
                        }
                      >
                        {
                          shortenValue(
                            walletAddress
                          )
                        }
                      </p>

                      {
                        walletExplorerHref
                          ? (
                            <a
                              href={
                                walletExplorerHref
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                            >
                              Open wallet
                            </a>
                          )
                          : null
                      }
                    </div>


                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        On-chain status
                      </p>

                      <div className="mt-2">
                        <ImpactStatusPill
                          status={
                            onchainStatus ??
                            "unknown"
                          }
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-600">
                        Registry lifecycle: {
                          mintReadinessStatus ??
                          "unknown"
                        }
                      </p>
                    </div>

                  </div>


                  <div className="mt-4 grid gap-3 md:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        On-chain metadata hash
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs text-slate-700"
                        title={
                          onchainMetadataHash ??
                          undefined
                        }
                      >
                        {
                          onchainMetadataHash ??
                          "Not available"
                        }
                      </p>

                    </div>


                    <div className="rounded-xl border border-slate-200 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Token URI
                      </p>

                      <p
                        className="mt-2 break-all font-mono text-xs text-slate-700"
                        title={
                          tokenUri ??
                          undefined
                        }
                      >
                        {
                          tokenUri ??
                          "Not available"
                        }
                      </p>

                      {
                        tokenUri
                          ? (
                            <a
                              href={
                                tokenUri
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                            >
                              Open canonical metadata
                            </a>
                          )
                          : null
                      }

                    </div>

                  </div>

                </section>
              )
              : null
          }


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
              "methodology_code",

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

              "chain_id",
              "contract_address",
              "token_id",
              "token_tx_hash",
              "wallet_address",
              "token_uri",
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