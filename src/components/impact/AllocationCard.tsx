import Link from "next/link";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import type {
  AllocationSource,
  AllocationWithDetails,
  ImpactRawRecord,
  ImpactRawValue,
} from "@/lib/impact/allocations";

type AllocationCardProps = {
  item: AllocationWithDetails;
};

function pickString(
  record: ImpactRawRecord | null,
  keys: string[],
  fallback = "—"
) {
  if (!record) return fallback;

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

function pickNumber(record: ImpactRawRecord | null, keys: string[]) {
  if (!record) return null;

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

function sumSourceCents(sources: AllocationSource[]) {
  return sources.reduce((total, source) => {
    const cents =
      pickNumber(source, ["viu_cents", "assigned_viu_cents"]) ?? 0;

    return total + cents;
  }, 0);
}

export function AllocationCard({ item }: AllocationCardProps) {
  const { allocation, client, sources } = item;

  const allocationReference = pickString(allocation, [
    "allocation_reference",
    "reference",
    "permanent_id",
    "id",
  ]);

  const status = pickString(
    allocation,
    ["allocation_status", "status"],
    "unknown"
  );

  const clientName = pickString(
    client,
    ["client_name", "name", "client_code", "code"],
    pickString(allocation, ["client_name", "client_code"], "Unknown client")
  );

  const directCents = pickNumber(allocation, [
    "total_viu_cents",
    "viu_cents",
    "allocated_viu_cents",
    "total_allocated_viu_cents",
  ]);

  const totalCents = directCents ?? sumSourceCents(sources);

  const directViu = pickNumber(allocation, [
    "total_viu_amount",
    "viu_amount",
    "allocated_viu_amount",
  ]);

  const totalViu = directViu ?? totalCents / 100;

  const kgEquivalent =
    pickNumber(allocation, ["kg_equivalent", "total_kg_equivalent"]) ??
    totalCents * 10;

  const manifestHash = pickString(
    allocation,
    ["allocation_manifest_hash", "manifest_hash"],
    "No hash"
  );

  const verifyHref =
    allocationReference !== "—"
      ? `/impact/verify/allocation/${encodeURIComponent(allocationReference)}`
      : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Client Allocation
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {allocationReference}
          </h3>
        </div>

        <ImpactStatusPill status={status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Client
          </p>
          <p className="font-medium text-slate-900">{clientName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Total VIU
            </p>
            <p className="font-bold text-slate-950">
              {formatNumber(totalViu)}
            </p>
            <p className="text-xs text-slate-500">
              {formatNumber(totalCents)} cent_VIUs
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              kg equivalent
            </p>
            <p className="font-bold text-slate-950">
              {formatNumber(kgEquivalent)}
            </p>
            <p className="text-xs text-slate-500">kg assigned</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Allocation Hash
          </p>
          <p className="break-all font-mono text-xs text-slate-600">
            {manifestHash === "No hash" ? manifestHash : shortenHash(manifestHash)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Sources
          </p>

          {sources.length > 0 ? (
            <div className="mt-2 space-y-2">
              {sources.map((source, index) => {
                const sourcePermanentId = pickString(source, [
                  "source_permanent_id",
                  "viu_asset_id",
                  "fractional_tranche_id",
                  "id",
                ]);

                const sourceType = pickString(source, ["source_type"]);
                const sourceStatus = pickString(
                  source,
                  ["source_status", "status"],
                  "unknown"
                );

                const sourceCents =
                  pickNumber(source, ["viu_cents", "assigned_viu_cents"]) ?? 0;

                const sourceViu =
                  pickNumber(source, ["viu_amount"]) ?? sourceCents / 100;

                return (
                  <div
                    key={`${sourcePermanentId}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {sourcePermanentId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sourceType} · {formatNumber(sourceViu)} VIU
                        </p>
                      </div>

                      <ImpactStatusPill status={sourceStatus} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              No sources attached.
            </p>
          )}
        </div>
      </div>

      {verifyHref ? (
        <Link
          href={verifyHref}
          className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open allocation verification page
        </Link>
      ) : null}
    </article>
  );
}