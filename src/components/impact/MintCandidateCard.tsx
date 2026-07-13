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

function pickString(
  record: ImpactRawRecord,
  keys: string[],
  fallback = "—"
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function pickNumber(record: ImpactRawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
}

function formatNumber(value: ImpactRawValue) {
  if (value === null || value === undefined) return "—";

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);

  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function shortenHash(hash: string) {
  if (hash.length <= 24) return hash;
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export function MintCandidateCard({ candidate }: MintCandidateCardProps) {
  const mintReference = pickString(candidate, [
    "mint_permanent_id",
    "mint_reference",
    "permanent_id",
    "metadata_id",
    "id",
  ]);

  const viuId = pickString(candidate, [
    "viu_asset_permanent_id",
    "asset_permanent_id",
    "source_permanent_id",
    "future_token_id",
    "viu_asset_id",
  ]);

  const allocationReference = pickString(candidate, [
    "allocation_reference",
    "allocation_id",
  ]);

  const clientName = pickString(candidate, [
    "client_name",
    "client_code",
    "client_id",
  ]);

  const readinessStatus = pickString(
    candidate,
    ["mint_readiness_status", "tokenization_status"],
    "unknown"
  );

  const onchainStatus = pickString(candidate, ["onchain_status"], "not_minted");

  const assignedCents = pickNumber(candidate, ["assigned_viu_cents"]);
  const assignedViu =
    pickNumber(candidate, ["assigned_viu_amount"]) ??
    (assignedCents !== null ? assignedCents / 100 : null);

  const kgEquivalent =
    pickNumber(candidate, ["kg_equivalent"]) ??
    (assignedCents !== null ? assignedCents * 10 : null);

  const metadataHash = pickString(
    candidate,
    ["onchain_metadata_hash", "metadata_hash"],
    "No metadata hash"
  );

  const assetHash = pickString(
    candidate,
    ["asset_manifest_hash"],
    "No asset hash"
  );

  const allocationHash = pickString(
    candidate,
    ["allocation_manifest_hash"],
    "No allocation hash"
  );

  const verifyViuHref =
    viuId !== "—" ? `/impact/verify/viu/${encodeURIComponent(viuId)}` : null;

  const verifyAllocationHref =
    allocationReference !== "—"
      ? `/impact/verify/allocation/${encodeURIComponent(allocationReference)}`
      : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Future Mint Candidate
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {mintReference}
          </h3>
        </div>

        <ImpactStatusPill status={readinessStatus} />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Assigned VIU
            </p>
            <p className="font-bold text-slate-950">
              {formatNumber(assignedViu)}
            </p>
            <p className="text-xs text-slate-500">
              {formatNumber(kgEquivalent)} kg
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              On-chain status
            </p>
            <p className="font-bold text-slate-950">{onchainStatus}</p>
            <p className="text-xs text-slate-500">
              Chain: {pickString(candidate, ["chain_id"], "pending")}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            VIU Asset
          </p>
          <p className="font-medium text-slate-900">{viuId}</p>
          <p className="text-xs text-slate-500">
            Future token ID: {pickString(candidate, ["future_token_id"], viuId)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Client / Allocation
          </p>
          <p className="font-medium text-slate-900">{clientName}</p>
          <p className="text-xs text-slate-500">{allocationReference}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            On-chain metadata hash
          </p>
          <p className="break-all font-mono text-xs text-slate-600">
            {metadataHash === "No metadata hash"
              ? metadataHash
              : shortenHash(metadataHash)}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Asset hash
            </p>
            <p className="break-all font-mono text-xs text-slate-600">
              {assetHash === "No asset hash" ? assetHash : shortenHash(assetHash)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Allocation hash
            </p>
            <p className="break-all font-mono text-xs text-slate-600">
              {allocationHash === "No allocation hash"
                ? allocationHash
                : shortenHash(allocationHash)}
            </p>
          </div>
        </div>
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
            href={verifyAllocationHref}
            className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open allocation verification
          </Link>
        ) : null}
      </div>
    </article>
  );
}