import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  ImpactMetricCard,
} from "@/components/impact/ImpactMetricCard";

import {
  ImpactPageHeader,
} from "@/components/impact/ImpactPageHeader";

import {
  ImpactSection,
} from "@/components/impact/ImpactSection";

import {
  ImpactStatusPill,
} from "@/components/impact/ImpactStatusPill";

import {
  getConversionHistoryData,
  getConversionTraceabilityData,
  isValidConversionId,
} from "@/lib/impact/conversions";

export const dynamic =
  "force-dynamic";

type ConversionDetailPageProps = {
  params: Promise<{
    conversionId: string;
  }>;
};

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  const numericValue =
    Number(value ?? 0);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : 0;
}

function formatNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  ).format(
    toNumber(value)
  );
}

function formatPreciseNumber(
  value:
    | number
    | string
    | null
    | undefined
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 8,
    }
  ).format(
    toNumber(value)
  );
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(value)
  );
}

function formatLabel(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function signedNumber(
  value:
    | number
    | string
) {
  const numericValue =
    toNumber(value);

  if (numericValue > 0) {
    return `+${formatNumber(
      numericValue
    )}`;
  }

  return formatNumber(
    numericValue
  );
}

export default async function ConversionDetailPage({
  params,
}: ConversionDetailPageProps) {
  const {
    conversionId,
  } = await params;

  if (
    !isValidConversionId(
      conversionId
    )
  ) {
    notFound();
  }

  const {
    traceability,
    errorMessage,
  } =
    await getConversionTraceabilityData(
      conversionId
    );

  if (!traceability) {
    return (
      <>
        <div className="mb-4">
          <Link
            href="/impact/conversions"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← Back to conversion history
          </Link>
        </div>

        <ImpactPageHeader
          title="Conversion Detail"
          description="No se pudo recuperar la conversión solicitada."
        >
          <ImpactStatusPill
            status="warning"
          />
        </ImpactPageHeader>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage ??
            "Conversion not found."}
        </div>
      </>
    );
  }

  const {
    summary,
    evidence_package:
      evidencePackage,
    evidence_files:
      evidenceFiles,
    verified_impact:
      verifiedImpact,
    import_logs:
      importLogs,
    import_movement:
      importMovement,
    conversion_batch:
      conversionBatch,
    conversion_movement:
      conversionMovement,
    viu_assets:
      viuAssets,
    fractional_viu_tranches:
      fractionalTranches,
    process_chain:
      processChain,
  } = traceability;

  const conversionHistory =
    await getConversionHistoryData();

  const historyConversion =
    conversionHistory
      .conversions
      .find(
        (item) =>
          item.conversionBatchId ===
          conversionId
      ) ??
    null;

  const methodologyCode =
    conversionBatch
      .methodology_code ??
    historyConversion
      ?.methodologyCode ??
    "Not available";

  const methodologyVersion =
    conversionBatch
      .methodology_version ??
    historyConversion
      ?.methodologyVersion ??
    "—";

  const methodologyMassPerViu =
    conversionBatch
      .methodology_mass_per_viu ??
    historyConversion
      ?.methodologyMassPerViu ??
    null;

  const methodologyMassUnit =
    conversionBatch
      .methodology_mass_unit ??
    historyConversion
      ?.methodologyMassUnit ??
    "—";

  const methodologyKgPerViu =
    conversionBatch
      .methodology_kg_per_viu ??
    historyConversion
      ?.methodologyKgPerViu ??
    null;

  const methodologyKgPerCentViu =
    conversionBatch
      .methodology_kg_per_cent_viu ??
    historyConversion
      ?.methodologyKgPerCentViu ??
    null;

  const methodologyManifestHash =
    conversionBatch
      .methodology_manifest_hash ??
    historyConversion
      ?.methodologyManifestHash ??
    null;

  return (
    <>
      <div className="mb-4">
        <Link
          href="/impact/conversions"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to conversion history
        </Link>
      </div>

      <ImpactPageHeader
        title={
          summary
            .conversion_permanent_id
        }
        description="Cadena auditable desde el paquete de evidencia hasta los activos VIU y FVIU generados."
      >
        <ImpactStatusPill
          status={
            conversionBatch
              .conversion_status
          }
        />

        <ImpactStatusPill
          status={
            conversionBatch
              .assets_generation_status
          }
        />

        <ImpactStatusPill
          status={
            summary
              .traceability_ready
              ? "Traceability ready"
              : "Traceability issue"
          }
        />
      </ImpactPageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Input impact"
          value={`${formatNumber(
            conversionBatch.kg_input
          )} kg`}
          helper="Kilograms received by the conversion"
        />

        <ImpactMetricCard
          label="Creditable impact"
          value={`${formatNumber(
            conversionBatch
              .converted_kg
          )} kg`}
          helper={`${conversionBatch.viu_cents_generated} cent_VIU generated`}
        />

        <ImpactMetricCard
          label="Full VIUs"
          value={formatNumber(
            conversionBatch
              .full_viu_count
          )}
          helper={`${summary.viu_asset_count} assets found`}
        />

        <ImpactMetricCard
          label="Non-creditable residual"
          value={`${formatNumber(
            conversionBatch
              .residual_kg
          )} kg`}
          helper="Accumulated as discard control"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Applied VIU methodology
            </p>

            <p className="mt-2 text-lg font-bold text-slate-950">
              {methodologyCode}
              {methodologyVersion !== "—"
                ? ` · v${methodologyVersion}`
                : ""}
            </p>

            <p className="mt-1 text-sm text-slate-700">
              1 VIU ={" "}
              {formatPreciseNumber(
                methodologyMassPerViu
              )}{" "}
              {methodologyMassUnit}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatPreciseNumber(
                methodologyKgPerViu
              )}{" "}
              kg / VIU ·{" "}
              {formatPreciseNumber(
                methodologyKgPerCentViu
              )}{" "}
              kg / cent_VIU
            </p>
          </div>

          {methodologyManifestHash ? (
            <div className="max-w-xl rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Methodology Manifest Hash
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                {methodologyManifestHash}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Process chain"
          description="Secuencia de entidades y movimientos que dieron origen a los activos de esta conversión."
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {processChain.map(
              (
                chainStep
              ) => (
                <div
                  key={
                    chainStep.step
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Step {
                      chainStep.step
                    }
                  </p>

                  <p className="mt-2 font-bold text-slate-950">
                    {formatLabel(
                      chainStep
                        .entity_type
                    )}
                  </p>

                  {chainStep
                    .permanent_id ? (
                    <p className="mt-2 break-all font-mono text-xs text-slate-600">
                      {
                        chainStep
                          .permanent_id
                      }
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      {
                        chainStep
                          .full_viu_count ??
                        0
                      }{" "}
                      full VIU ·{" "}
                      {
                        chainStep
                          .fractional_tranche_count ??
                        0
                      }{" "}
                      FVIU tranche
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Source and conversion"
          description="Identificadores permanentes y valores principales de la operación."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evidence package
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                {
                  evidencePackage
                    .permanent_id
                }
              </p>

              <Link
                href={`/impact/evidence/${evidencePackage.id}`}
                className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                View source evidence →
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Verified impact
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                {
                  verifiedImpact
                    .permanent_id
                }
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {formatNumber(
                  verifiedImpact
                    .verified_kg
                )}{" "}
                verified kg
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conversion
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-slate-950">
                {
                  conversionBatch
                    .permanent_id
                }
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {formatDate(
                  conversionBatch
                    .created_at
                )}
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-700">
                {methodologyCode}
                {methodologyVersion !== "—"
                  ? ` · v${methodologyVersion}`
                  : ""}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                {
                  conversionBatch
                    .scope_name
                }
              </p>

              <p className="mt-1 font-mono text-xs text-slate-500">
                {
                  conversionBatch
                    .scope_code
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Impact line
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                {formatLabel(
                  conversionBatch
                    .impact_line
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evidence files
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                {
                  evidenceFiles.length
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {
                  importLogs.length
                }{" "}
                import log
              </p>
            </div>
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Wallet movements"
          description="Movimientos contables que registran el ingreso de kg y su posterior conversión en VIU."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {[importMovement,
              conversionMovement]
              .filter(
                (
                  movement
                ): movement is NonNullable<
                  typeof movement
                > =>
                  movement !==
                  null
              )
              .map(
                (
                  movement
                ) => (
                  <article
                    key={
                      movement.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-mono text-sm font-bold text-slate-950">
                        {
                          movement
                            .permanent_id
                        }
                      </h3>

                      <ImpactStatusPill
                        status={
                          movement
                            .movement_status
                        }
                      />
                    </div>

                    <p className="mt-2 font-semibold text-slate-900">
                      {formatLabel(
                        movement
                          .movement_type
                      )}
                    </p>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Verified kg delta
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                          {signedNumber(
                            movement
                              .verified_kg_balance_delta
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Spendable VIU delta
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                          {signedNumber(
                            movement
                              .spendable_viu_cents_delta
                          )}{" "}
                          cent_VIU
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Residual delta
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                          {signedNumber(
                            movement
                              .residual_kg_delta
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Created
                        </dt>

                        <dd className="mt-1 text-sm text-slate-900">
                          {formatDate(
                            movement
                              .created_at
                          )}
                        </dd>
                      </div>
                    </dl>

                    {movement.notes ? (
                      <p className="mt-4 text-sm text-slate-600">
                        {
                          movement.notes
                        }
                      </p>
                    ) : null}
                  </article>
                )
              )}
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Generated Level 2 assets"
          description="Activos VIU completos y tramos fraccionarios generados exclusivamente por esta conversión."
        >
          <div className="grid gap-4">
            {viuAssets.map(
              (
                asset
              ) => (
                <article
                  key={
                    asset.id
                  }
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono font-bold text-emerald-950">
                          {
                            asset
                              .permanent_id
                          }
                        </h3>

                        <ImpactStatusPill
                          status={
                            asset
                              .asset_status
                          }
                        />
                      </div>

                      <p className="mt-2 text-sm text-emerald-800">
                        Sequence{" "}
                        {
                          asset
                            .asset_sequence_in_batch
                        }{" "}
                        ·{" "}
                        {
                          asset
                            .viu_cents
                        }{" "}
                        cent_VIU ·{" "}
                        {formatNumber(
                          asset
                            .kg_equivalent
                        )}{" "}
                        kg
                      </p>

                      <p className="mt-1 text-xs font-semibold text-emerald-900">
                        Methodology: {asset.methodology_code}
                        {methodologyVersion !== "—"
                          ? ` · v${methodologyVersion}`
                          : ""}
                      </p>
                    </div>

                    <Link
                      href={`/impact/verify/viu/${encodeURIComponent(
                        asset.permanent_id
                      )}`}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Open VIU
                    </Link>
                  </div>
                </article>
              )
            )}

            {fractionalTranches.map(
              (
                tranche
              ) => (
                <article
                  key={
                    tranche.id
                  }
                  className="rounded-2xl border border-violet-200 bg-violet-50 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-mono font-bold text-violet-950">
                      {
                        tranche
                          .permanent_id
                      }
                    </h3>

                    <ImpactStatusPill
                      status={
                        tranche
                          .tranche_status
                      }
                    />
                  </div>

                  <p className="mt-2 text-sm text-violet-800">
                    {
                      tranche
                        .total_viu_cents
                    }{" "}
                    cent_VIU ·{" "}
                    {formatNumber(
                      tranche
                        .kg_equivalent
                    )}{" "}
                    kg equivalent
                  </p>

                  <p className="mt-1 text-xs font-semibold text-violet-900">
                    Methodology: {tranche.methodology_code}
                    {methodologyVersion !== "—"
                      ? ` · v${methodologyVersion}`
                      : ""}
                  </p>
                </article>
              )
            )}

            {viuAssets.length ===
              0 &&
            fractionalTranches.length ===
              0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No Level 2 assets were found for this conversion.
              </p>
            ) : null}
          </div>
        </ImpactSection>
      </div>
    </>
  );
}