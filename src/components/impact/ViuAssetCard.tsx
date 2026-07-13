import Link from "next/link";
import type { ImpactViuAssetCard } from "@/lib/impact/viu-cards";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";

type ViuAssetCardProps = {
  card: ImpactViuAssetCard;
};

function pickString(
  record: ImpactViuAssetCard,
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

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function shortenHash(hash: string) {
  if (hash.length <= 24) return hash;
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export function ViuAssetCard({ card }: ViuAssetCardProps) {
  const permanentId = pickString(card, [
    "permanent_id",
    "viu_asset_permanent_id",
    "asset_permanent_id",
    "id",
  ]);

  const status = pickString(card, ["asset_status", "status"], "unknown");

  const scope = pickString(card, ["scope_name", "scope_code"], "Unknown scope");

  const impactLine = pickString(card, ["impact_line"], "unknown line");

  const client = pickString(
    card,
    [
      "client_name",
      "allocated_client_name",
      "client_code",
      "allocated_client_code",
    ],
    "Not assigned"
  );

  const allocationReference = pickString(
    card,
    ["allocation_reference", "assigned_allocation_reference"],
    "No allocation"
  );

  const manifestHash = pickString(
    card,
    ["asset_manifest_hash", "manifest_hash"],
    "No hash"
  );

  const tokenStatus = pickString(
    card,
    ["tokenization_status", "onchain_status"],
    "not prepared"
  );

  const viuAmount =
    card.viu_amount ??
    (typeof card.viu_cents === "number" ? card.viu_cents / 100 : null);

  const verifyHref =
    permanentId !== "—" ? `/impact/verify/viu/${encodeURIComponent(permanentId)}` : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            VIU Asset
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {permanentId}
          </h3>
        </div>

        <ImpactStatusPill status={status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Amount
          </p>
          <p className="font-medium text-slate-900">
            {formatNumber(viuAmount)} VIU · {formatNumber(card.kg_equivalent)} kg
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Source
          </p>
          <p className="font-medium text-slate-900">{scope}</p>
          <p className="text-xs text-slate-500">{impactLine}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Client / Allocation
          </p>
          <p className="font-medium text-slate-900">{client}</p>
          <p className="text-xs text-slate-500">{allocationReference}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Manifest Hash
          </p>
          <p className="break-all font-mono text-xs text-slate-600">
            {manifestHash === "No hash" ? manifestHash : shortenHash(manifestHash)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Token readiness
          </p>
          <p className="font-medium text-slate-900">{tokenStatus}</p>
          <p className="text-xs text-slate-500">
            Future token ID: {pickString(card, ["future_token_id"], permanentId)}
          </p>
        </div>
      </div>

      {verifyHref ? (
        <Link
          href={verifyHref}
          className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open verification page
        </Link>
      ) : null}
    </article>
  );
}