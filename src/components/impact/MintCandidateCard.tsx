import Link from "next/link";

import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";

import type {
  ImpactRawRecord,
  ImpactRawValue,
  MintCandidate,
} from "@/lib/impact/mint-candidates";

type MintCandidateCardProps = {
  candidate: MintCandidate;
};

const BASE_SEPOLIA_EXPLORER =
  "https://sepolia.basescan.org";

function pickString(
  record: ImpactRawRecord,
  keys: string[],
  fallback = "—",
) {
  for (const key of keys) {
    const value = record[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function pickNumber(
  record: ImpactRawRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      const parsed =
        Number.parseFloat(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatNumber(
  value: ImpactRawValue,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
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

function shortenValue(
  value: string,
  start = 12,
  end = 8,
) {
  if (
    value === "—" ||
    value.length <= start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start,
  )}...${value.slice(-end)}`;
}

function isHttpUrl(
  value: string,
) {
  return (
    value.startsWith("https://") ||
    value.startsWith("http://")
  );
}

function getNetworkName(
  chainId: string,
) {
  if (chainId === "84532") {
    return "Base Sepolia";
  }

  if (chainId === "—") {
    return "Pending";
  }

  return `Chain ${chainId}`;
}

export function MintCandidateCard({
  candidate,
}: MintCandidateCardProps) {
  const mintReference =
    pickString(candidate, [
      "mint_permanent_id",
      "mint_reference",
      "permanent_id",
      "metadata_id",
      "id",
    ]);

  const viuId =
    pickString(candidate, [
      "viu_asset_permanent_id",
      "asset_permanent_id",
      "source_permanent_id",
      "future_token_id",
      "viu_asset_id",
    ]);

  const futureTokenId =
    pickString(
      candidate,
      ["future_token_id"],
      viuId,
    );

  const allocationReference =
    pickString(candidate, [
      "allocation_reference",
      "allocation_id",
    ]);

  const clientName =
    pickString(candidate, [
      "client_name",
      "client_display_name",
      "client_code",
      "client_id",
    ]);

  const readinessStatus =
    pickString(
      candidate,
      [
        "mint_readiness_status",
        "tokenization_status",
      ],
      "unknown",
    );

  const onchainStatus =
    pickString(
      candidate,
      ["onchain_status"],
      "not_minted",
    );

  const tokenizationStatus =
    pickString(
      candidate,
      ["tokenization_status"],
      "not_tokenized",
    );

  const assignedCents =
    pickNumber(candidate, [
      "assigned_viu_cents",
    ]);

  const assignedViu =
    pickNumber(candidate, [
      "assigned_viu_amount",
    ]) ??
    (
      assignedCents !== null
        ? assignedCents / 100
        : null
    );

  const kgEquivalent =
    pickNumber(candidate, [
      "kg_equivalent",
    ]) ??
    (
      assignedCents !== null
        ? assignedCents * 10
        : null
    );

  const metadataHash =
    pickString(
      candidate,
      [
        "onchain_metadata_hash",
        "metadata_hash",
      ],
      "No metadata hash",
    );

  const assetHash =
    pickString(
      candidate,
      ["asset_manifest_hash"],
      "No asset hash",
    );

  const allocationHash =
    pickString(
      candidate,
      ["allocation_manifest_hash"],
      "No allocation hash",
    );

  /*
   * Blockchain execution identity.
   */
  const chainId =
    pickString(
      candidate,
      ["chain_id"],
      "—",
    );

  const contractAddress =
    pickString(
      candidate,
      ["contract_address"],
      "—",
    );

  const tokenId =
    pickString(
      candidate,
      ["token_id"],
      "—",
    );

  const tokenUri =
    pickString(
      candidate,
      ["token_uri"],
      "—",
    );

  const tokenTxHash =
    pickString(
      candidate,
      [
        "token_tx_hash",
        "transaction_hash",
        "tx_hash",
      ],
      "—",
    );

  const walletAddress =
    pickString(
      candidate,
      [
        "wallet_address",
        "mint_recipient",
      ],
      "—",
    );

  const isMinted =
    readinessStatus ===
      "minted_on_chain" ||
    onchainStatus ===
      "minted" ||
    tokenizationStatus ===
      "tokenized";

  const networkName =
    getNetworkName(chainId);

  /*
   * Internal verification routes.
   */
  const verifyViuHref =
    viuId !== "—"
      ? `/impact/verify/viu/${encodeURIComponent(
          viuId,
        )}`
      : null;

  const verifyAllocationHref =
    allocationReference !== "—"
      ? `/impact/verify/allocation/${encodeURIComponent(
          allocationReference,
        )}`
      : null;

  /*
   * Base Sepolia explorer links.
   *
   * Only enabled for the testnet chain currently
   * configured in Blockchain Level 3 / 11A.
   */
  const usesBaseSepolia =
    chainId === "84532";

  const transactionExplorerHref =
    usesBaseSepolia &&
    tokenTxHash !== "—"
      ? `${BASE_SEPOLIA_EXPLORER}/tx/${tokenTxHash}`
      : null;

  const contractExplorerHref =
    usesBaseSepolia &&
    contractAddress !== "—"
      ? `${BASE_SEPOLIA_EXPLORER}/address/${contractAddress}`
      : null;

  const walletExplorerHref =
    usesBaseSepolia &&
    walletAddress !== "—"
      ? `${BASE_SEPOLIA_EXPLORER}/address/${walletAddress}`
      : null;

  const tokenExplorerHref =
    usesBaseSepolia &&
    contractAddress !== "—" &&
    tokenId !== "—"
      ? `${BASE_SEPOLIA_EXPLORER}/token/${contractAddress}?a=${tokenId}`
      : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isMinted
              ? "On-chain VIU"
              : "Future Mint Candidate"}
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {mintReference}
          </h3>
        </div>

        <ImpactStatusPill
          status={readinessStatus}
        />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Assigned VIU
            </p>

            <p className="font-bold text-slate-950">
              {formatNumber(
                assignedViu,
              )}
            </p>

            <p className="text-xs text-slate-500">
              {formatNumber(
                kgEquivalent,
              )}{" "}
              kg
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              On-chain status
            </p>

            <p className="font-bold text-slate-950">
              {onchainStatus}
            </p>

            <p className="text-xs text-slate-500">
              {isMinted
                ? `${networkName} · Chain ${chainId}`
                : `Chain: ${
                    chainId === "—"
                      ? "pending"
                      : chainId
                  }`}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            VIU Asset
          </p>

          <p className="font-medium text-slate-900">
            {viuId}
          </p>

          <p className="text-xs text-slate-500">
            Future token ID:{" "}
            {futureTokenId}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Client / Allocation
          </p>

          <p className="font-medium text-slate-900">
            {clientName}
          </p>

          <p className="text-xs text-slate-500">
            {allocationReference}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            On-chain metadata hash
          </p>

          <p
            className="break-all font-mono text-xs text-slate-600"
            title={
              metadataHash ===
              "No metadata hash"
                ? undefined
                : metadataHash
            }
          >
            {metadataHash ===
            "No metadata hash"
              ? metadataHash
              : shortenValue(
                  metadataHash,
                )}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Asset hash
            </p>

            <p
              className="break-all font-mono text-xs text-slate-600"
              title={
                assetHash ===
                "No asset hash"
                  ? undefined
                  : assetHash
              }
            >
              {assetHash ===
              "No asset hash"
                ? assetHash
                : shortenValue(
                    assetHash,
                  )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Allocation hash
            </p>

            <p
              className="break-all font-mono text-xs text-slate-600"
              title={
                allocationHash ===
                "No allocation hash"
                  ? undefined
                  : allocationHash
              }
            >
              {allocationHash ===
              "No allocation hash"
                ? allocationHash
                : shortenValue(
                    allocationHash,
                  )}
            </p>
          </div>
        </div>

        {isMinted ? (
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Blockchain Identity
                </p>

                <p className="mt-1 font-semibold text-slate-950">
                  {networkName}
                </p>
              </div>

              <ImpactStatusPill
                status={
                  onchainStatus
                }
              />
            </div>

            <dl className="mt-4 grid gap-3 text-xs">
              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Chain ID
                </dt>

                <dd className="mt-1 font-mono text-slate-700">
                  {chainId}
                </dd>
              </div>

              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Contract
                </dt>

                <dd
                  className="mt-1 break-all font-mono text-slate-700"
                  title={contractAddress}
                >
                  {shortenValue(
                    contractAddress,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Token ID
                </dt>

                <dd
                  className="mt-1 break-all font-mono text-slate-700"
                  title={tokenId}
                >
                  {shortenValue(
                    tokenId,
                    18,
                    12,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Mint transaction
                </dt>

                <dd
                  className="mt-1 break-all font-mono text-slate-700"
                  title={tokenTxHash}
                >
                  {shortenValue(
                    tokenTxHash,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Mint recipient / Wallet
                </dt>

                <dd
                  className="mt-1 break-all font-mono text-slate-700"
                  title={walletAddress}
                >
                  {shortenValue(
                    walletAddress,
                  )}
                </dd>
              </div>

              <div>
                <dt className="font-semibold uppercase text-slate-400">
                  Token URI
                </dt>

                <dd
                  className="mt-1 break-all font-mono text-slate-700"
                  title={tokenUri}
                >
                  {tokenUri === "—"
                    ? "—"
                    : shortenValue(
                        tokenUri,
                        32,
                        18,
                      )}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {transactionExplorerHref ? (
                <a
                  href={
                    transactionExplorerHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open transaction
                </a>
              ) : null}

              {tokenExplorerHref ? (
                <a
                  href={
                    tokenExplorerHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open token
                </a>
              ) : null}

              {contractExplorerHref ? (
                <a
                  href={
                    contractExplorerHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open contract
                </a>
              ) : null}

              {walletExplorerHref ? (
                <a
                  href={
                    walletExplorerHref
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open wallet
                </a>
              ) : null}

              {tokenUri !== "—" &&
              isHttpUrl(tokenUri) ? (
                <a
                  href={tokenUri}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Open metadata
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {verifyViuHref ? (
          <Link
            href={verifyViuHref}
            className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open VIU verification
          </Link>
        ) : null}

        {verifyAllocationHref ? (
          <Link
            href={
              verifyAllocationHref
            }
            className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open allocation verification
          </Link>
        ) : null}
      </div>
    </article>
  );
}