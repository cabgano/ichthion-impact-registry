import type { FractionalViuTranche } from "@/lib/impact/fractional-pool";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";

type FractionalTrancheCardProps = {
  tranche: FractionalViuTranche;
};

function pickString(
  record: FractionalViuTranche,
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

function pickNumber(
  record: FractionalViuTranche,
  keys: string[],
  fallback: string | number = "—"
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed)) return parsed;
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

export function FractionalTrancheCard({
  tranche,
}: FractionalTrancheCardProps) {
  const permanentId = pickString(tranche, [
    "permanent_id",
    "tranche_permanent_id",
    "fractional_tranche_permanent_id",
    "id",
  ]);

  const status = pickString(tranche, ["tranche_status", "status"], "unknown");

  const scope = pickString(
    tranche,
    ["scope_name", "scope_code"],
    "Unknown scope"
  );

  const impactLine = pickString(tranche, ["impact_line"], "unknown line");

  const totalCents = pickNumber(tranche, ["total_viu_cents"], 0);
  const availableCents = pickNumber(tranche, ["available_viu_cents"], 0);
  const allocatedCents = pickNumber(tranche, ["allocated_viu_cents"], 0);

  const totalViu =
    tranche.total_viu_amount ??
    (typeof totalCents === "number" ? totalCents / 100 : null);

  const availableViu =
    tranche.available_viu_amount ??
    (typeof availableCents === "number" ? availableCents / 100 : null);

  const allocatedViu =
    tranche.allocated_viu_amount ??
    (typeof allocatedCents === "number" ? allocatedCents / 100 : null);

  const manifestHash = pickString(
    tranche,
    ["tranche_manifest_hash", "manifest_hash"],
    "No hash"
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            FVIU Tranche
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
            Total
          </p>
          <p className="font-medium text-slate-900">
            {formatNumber(totalViu)} VIU · {formatNumber(totalCents)} cent_VIUs
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Available
            </p>
            <p className="font-bold text-slate-950">
              {formatNumber(availableViu)} VIU
            </p>
            <p className="text-xs text-slate-500">
              {formatNumber(availableCents)} cent_VIUs
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Allocated
            </p>
            <p className="font-bold text-slate-950">
              {formatNumber(allocatedViu)} VIU
            </p>
            <p className="text-xs text-slate-500">
              {formatNumber(allocatedCents)} cent_VIUs
            </p>
          </div>
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
            kg equivalent
          </p>
          <p className="font-medium text-slate-900">
            {formatNumber(
              tranche.kg_equivalent ?? tranche.available_kg_equivalent
            )}{" "}
            kg
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Manifest Hash
          </p>
          <p className="break-all font-mono text-xs text-slate-600">
            {manifestHash === "No hash" ? manifestHash : shortenHash(manifestHash)}
          </p>
        </div>
      </div>
    </article>
  );
}