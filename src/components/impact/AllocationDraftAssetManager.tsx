"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";

import type {
  AllocationWorkspaceAsset,
  AllocationWorkspaceSource,
} from "@/lib/impact/allocations";

import { createClient } from "@/lib/supabase/client";

type AllocationDraftAssetManagerProps = {
  allocationId: string;
  expectedViuCents: number;
  reservedSources: AllocationWorkspaceSource[];
  availableAssets: AllocationWorkspaceAsset[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function AllocationDraftAssetManager({
  allocationId,
  expectedViuCents,
  reservedSources,
  availableAssets,
}: AllocationDraftAssetManagerProps) {
  const router = useRouter();

  const [
    pendingAssetId,
    setPendingAssetId,
  ] = useState<string | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const reservedCents =
    reservedSources.reduce(
      (total, source) =>
        total + source.viuCents,
      0
    );

  const targetReached =
    reservedCents >= expectedViuCents;

  async function reserveAsset(
    assetId: string
  ) {
    if (pendingAssetId) {
      return;
    }

    setPendingAssetId(assetId);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const {
        error,
      } = await supabase.rpc(
        "reserve_viu_asset_for_allocation_draft",
        {
          input_allocation_id:
            allocationId,

          input_viu_asset_id:
            assetId,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The VIU could not be reserved."
      );
    } finally {
      setPendingAssetId(null);
    }
  }

  async function releaseAsset(
    assetId: string
  ) {
    if (pendingAssetId) {
      return;
    }

    setPendingAssetId(assetId);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const {
        error,
      } = await supabase.rpc(
        "release_viu_asset_from_allocation_draft",
        {
          input_allocation_id:
            allocationId,

          input_viu_asset_id:
            assetId,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The VIU reservation could not be released."
      );
    } finally {
      setPendingAssetId(null);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-950">
              Reserved VIUs
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Exact VIU cards currently reserved for this allocation.
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm">
            <span className="font-bold text-slate-950">
              {formatNumber(
                reservedCents / 100
              )}
            </span>

            <span className="text-slate-500">
              {" / "}
              {formatNumber(
                expectedViuCents / 100
              )}{" "}
              VIU
            </span>
          </div>
        </div>

        {reservedSources.length > 0 ? (
          <div className="space-y-3">
            {reservedSources.map(
              (source) => {
                const isPending =
                  pendingAssetId ===
                  source.viuAssetId;

                return (
                  <article
                    key={source.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {
                              source.sourcePermanentId
                            }
                          </p>

                          <ImpactStatusPill
                            status={
                              source.sourceStatus
                            }
                          />
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatNumber(
                            source.viuCents /
                              100
                          )}{" "}
                          VIU ·{" "}
                          {formatNumber(
                            source.kgEquivalent ||
                              source.viuCents *
                                10
                          )}{" "}
                          kg
                        </p>

                        {source.sourceManifestHash ? (
                          <p className="mt-2 font-mono text-xs text-slate-500">
                            Source hash:{" "}
                            {source.sourceManifestHash.slice(
                              0,
                              16
                            )}
                            ...
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        disabled={
                          pendingAssetId !==
                          null
                        }
                        onClick={() =>
                          releaseAsset(
                            source.viuAssetId
                          )
                        }
                        className={[
                          "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",

                          pendingAssetId !==
                          null
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-red-200 bg-white text-red-700 hover:bg-red-50",
                        ].join(" ")}
                      >
                        {isPending
                          ? "Releasing..."
                          : "Release VIU"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No VIU cards have been reserved yet.
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h3 className="font-bold text-slate-950">
            Available VIUs
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select the exact verified VIU cards that will support this allocation.
          </p>
        </div>

        {targetReached ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            The draft target has been fully reserved. Release a VIU before selecting another one.
          </div>
        ) : null}

        {availableAssets.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {availableAssets.map(
              (asset) => {
                const isPending =
                  pendingAssetId ===
                  asset.id;

                return (
                  <article
                    key={asset.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">
                          {
                            asset.permanentId
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {asset.scopeName}
                        </p>
                      </div>

                      <ImpactStatusPill
                        status={
                          asset.assetStatus
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Impact line
                        </p>

                        <p className="text-slate-900">
                          {asset.impactLine}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          Period
                        </p>

                        <p className="text-slate-900">
                          {asset.periodKey}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          VIU
                        </p>

                        <p className="text-slate-900">
                          {formatNumber(
                            asset.viuCents /
                              100
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          kg equivalent
                        </p>

                        <p className="text-slate-900">
                          {formatNumber(
                            asset.kgEquivalent
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Source impact
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-600">
                        {
                          asset.sourceVerifiedImpactPermanentId
                        }
                      </p>

                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Asset manifest hash available
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        targetReached ||
                        pendingAssetId !==
                          null
                      }
                      onClick={() =>
                        reserveAsset(
                          asset.id
                        )
                      }
                      className={[
                        "mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition",

                        targetReached ||
                        pendingAssetId !==
                          null
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-slate-950 hover:bg-slate-700",
                      ].join(" ")}
                    >
                      {isPending
                        ? "Reserving..."
                        : "Reserve VIU"}
                    </button>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No available full VIU cards.
          </div>
        )}
      </section>
    </div>
  );
}