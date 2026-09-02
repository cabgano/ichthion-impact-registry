import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { MintCandidateCard } from "@/components/impact/MintCandidateCard";

import {
  getMintCandidatesData,
  type ImpactRawRecord,
  type ImpactRawValue,
  type MintCandidate,
} from "@/lib/impact/mint-candidates";

function pickValue(
  record: ImpactRawRecord | null,
  keys: string[],
) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).length > 0
    ) {
      return value;
    }
  }

  return null;
}

function valueToString(
  value: ImpactRawValue,
  fallback = "—",
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}

function formatNumber(
  value: ImpactRawValue,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "0";
  }

  const numericValue =
    typeof value === "string"
      ? Number.parseFloat(value)
      : Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    },
  ).format(numericValue);
}

function readinessStatus(
  candidate: MintCandidate,
) {
  return valueToString(
    pickValue(
      candidate,
      [
        "mint_readiness_status",
        "tokenization_status",
      ],
    ),
    "unknown",
  );
}

function onchainStatus(
  candidate: MintCandidate,
) {
  return valueToString(
    pickValue(
      candidate,
      ["onchain_status"],
    ),
    "unknown",
  );
}

function metadataHash(
  candidate: MintCandidate,
) {
  return valueToString(
    pickValue(
      candidate,
      [
        "onchain_metadata_hash",
        "metadata_hash",
      ],
    ),
    "",
  );
}

function assignedCents(
  candidate: MintCandidate,
) {
  const direct =
    pickValue(
      candidate,
      ["assigned_viu_cents"],
    );

  if (
    direct !== null &&
    direct !== undefined
  ) {
    const parsed =
      typeof direct === "string"
        ? Number.parseFloat(direct)
        : Number(direct);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const viuAmount =
    pickValue(
      candidate,
      ["assigned_viu_amount"],
    );

  if (
    viuAmount !== null &&
    viuAmount !== undefined
  ) {
    const parsed =
      typeof viuAmount === "string"
        ? Number.parseFloat(
            viuAmount,
          )
        : Number(viuAmount);

    if (!Number.isNaN(parsed)) {
      return parsed * 100;
    }
  }

  return 0;
}

/* ============================================================
 * MINT CANDIDATE ↔ ON-CHAIN METADATA MERGE
 *
 * assigned_viu_mint_candidates contains the business/readiness
 * context.
 *
 * assigned_viu_onchain_metadata contains the canonical MINT
 * preparation and, after minting, the real blockchain identity.
 *
 * We need BOTH records in the UI.
 * ============================================================
 */

function recordString(
  record: MintCandidate,
  keys: string[],
) {
  const value =
    pickValue(
      record,
      keys,
    );

  return value === null
    ? null
    : String(value);
}

function findMetadataRow(
  candidate: MintCandidate,
  metadataRows: MintCandidate[],
) {
  const candidateMintId =
    recordString(
      candidate,
      [
        "mint_permanent_id",
        "mint_reference",
        "metadata_id",
      ],
    );

  const candidateViuAssetId =
    recordString(
      candidate,
      ["viu_asset_id"],
    );

  const candidateViuPermanentId =
    recordString(
      candidate,
      [
        "viu_asset_permanent_id",
        "asset_permanent_id",
        "source_permanent_id",
      ],
    );

  const candidateFutureTokenId =
    recordString(
      candidate,
      ["future_token_id"],
    );

  return metadataRows.find(
    (metadata) => {
      const metadataMintId =
        recordString(
          metadata,
          [
            "mint_permanent_id",
            "permanent_id",
            "mint_reference",
            "metadata_id",
          ],
        );

      const metadataViuAssetId =
        recordString(
          metadata,
          ["viu_asset_id"],
        );

      const metadataViuPermanentId =
        recordString(
          metadata,
          [
            "viu_asset_permanent_id",
            "asset_permanent_id",
            "source_permanent_id",
          ],
        );

      const metadataFutureTokenId =
        recordString(
          metadata,
          ["future_token_id"],
        );

      if (
        candidateMintId &&
        metadataMintId &&
        candidateMintId ===
          metadataMintId
      ) {
        return true;
      }

      if (
        candidateViuAssetId &&
        metadataViuAssetId &&
        candidateViuAssetId ===
          metadataViuAssetId
      ) {
        return true;
      }

      if (
        candidateViuPermanentId &&
        metadataViuPermanentId &&
        candidateViuPermanentId ===
          metadataViuPermanentId
      ) {
        return true;
      }

      if (
        candidateFutureTokenId &&
        metadataFutureTokenId &&
        candidateFutureTokenId ===
          metadataFutureTokenId
      ) {
        return true;
      }

      return false;
    },
  );
}

function mergeMintCandidateRows(
  candidates: MintCandidate[],
  metadataRows: MintCandidate[],
): MintCandidate[] {
  /*
   * If the candidate view is empty, preserve the old fallback
   * behavior and use the metadata rows directly.
   */
  if (candidates.length === 0) {
    return metadataRows;
  }

  return candidates.map(
    (candidate) => {
      const metadata =
        findMetadataRow(
          candidate,
          metadataRows,
        );

      if (!metadata) {
        return candidate;
      }

      /*
       * Candidate provides allocation / business context.
       * Metadata is applied AFTER candidate so that the canonical
       * blockchain lifecycle and execution fields win.
       */
      return {
        ...candidate,
        ...metadata,

        /*
         * Preserve explicit candidate-side business identifiers
         * when metadata does not contain their equivalent.
         */
        allocation_reference:
          metadata.allocation_reference ??
          candidate.allocation_reference,

        client_code:
          metadata.client_code ??
          candidate.client_code,

        client_name:
          metadata.client_name ??
          candidate.client_name,

        assigned_viu_cents:
          metadata.assigned_viu_cents ??
          candidate.assigned_viu_cents,

        assigned_viu_amount:
          metadata.assigned_viu_amount ??
          candidate.assigned_viu_amount,

        kg_equivalent:
          metadata.kg_equivalent ??
          candidate.kg_equivalent,

        asset_manifest_hash:
          metadata.asset_manifest_hash ??
          candidate.asset_manifest_hash,

        allocation_manifest_hash:
          metadata.allocation_manifest_hash ??
          candidate.allocation_manifest_hash,
      };
    },
  );
}

export default async function ImpactMintCandidatesPage() {
  const {
    candidates,
    metadataRows,
    errorMessage,
  } =
    await getMintCandidatesData();

  /*
   * IMPORTANT:
   *
   * Do not choose between candidates OR metadata.
   * A blockchain-enabled VIU needs the information from both.
   */
  const rows =
    mergeMintCandidateRows(
      candidates,
      metadataRows,
    );

  const readyCount =
    rows.filter(
      (candidate) =>
        readinessStatus(
          candidate,
        )
          .toLowerCase()
          .includes("ready"),
    ).length;

  const mintedCount =
    rows.filter(
      (candidate) =>
        onchainStatus(
          candidate,
        ).toLowerCase() ===
        "minted",
    ).length;

  const notMintedCount =
    rows.filter(
      (candidate) =>
        onchainStatus(
          candidate,
        )
          .toLowerCase()
          .includes("not"),
    ).length;

  const hashedCount =
    rows.filter(
      (candidate) =>
        metadataHash(
          candidate,
        ).length > 0,
    ).length;

  const totalCents =
    rows.reduce(
      (
        total,
        candidate,
      ) =>
        total +
        assignedCents(
          candidate,
        ),
      0,
    );

  return (
    <>
      <ImpactPageHeader
        title="VIU Mint Candidates"
        description="VIUs completas asignadas a clientes, desde su preparación para mint hasta su identidad blockchain confirmada."
      >
        <ImpactStatusPill
          status={
            errorMessage
              ? "warning"
              : "connected"
          }
        />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>
            No se pudieron cargar todos los candidatos de mint.
          </strong>

          <p className="mt-1">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Mint candidates"
          value={formatNumber(
            rows.length,
          )}
          helper="VIUs completas asignadas"
        />

        <ImpactMetricCard
          label="Ready for future mint"
          value={formatNumber(
            readyCount,
          )}
          helper="Metadata preparada"
        />

        <ImpactMetricCard
          label="Minted on-chain"
          value={formatNumber(
            mintedCount,
          )}
          helper="Blockchain confirmada"
        />

        <ImpactMetricCard
          label="Total VIU"
          value={formatNumber(
            totalCents / 100,
          )}
          helper={`${formatNumber(
            totalCents * 10,
          )} kg equivalentes`}
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Blockchain readiness summary"
          description="Estado de preparación y ejecución blockchain de las VIUs asignadas."
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill
                status="ready_for_future_mint"
              />

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(
                  readyCount,
                )}
              </p>

              <p className="text-sm text-slate-500">
                ready candidates
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill
                status="not_minted"
              />

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(
                  notMintedCount,
                )}
              </p>

              <p className="text-sm text-slate-500">
                not minted yet
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill
                status="minted"
              />

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(
                  mintedCount,
                )}
              </p>

              <p className="text-sm text-slate-500">
                minted on-chain
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ImpactStatusPill
                status="metadata_hashed"
              />

              <p className="mt-3 text-2xl font-bold text-slate-950">
                {formatNumber(
                  hashedCount,
                )}
              </p>

              <p className="text-sm text-slate-500">
                with metadata hash
              </p>
            </div>
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Mint Candidate Gallery"
          description="VIUs completas asignadas, incluyendo candidatos preparados y activos ya confirmados on-chain."
        >
          {rows.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {rows.map(
                (
                  candidate,
                  index,
                ) => {
                  const key =
                    valueToString(
                      pickValue(
                        candidate,
                        [
                          "mint_permanent_id",
                          "mint_reference",
                          "permanent_id",
                          "metadata_id",
                          "id",
                        ],
                      ),
                      `mint-candidate-${index}`,
                    );

                  return (
                    <MintCandidateCard
                      key={key}
                      candidate={
                        candidate
                      }
                    />
                  );
                },
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No mint candidates available yet.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}