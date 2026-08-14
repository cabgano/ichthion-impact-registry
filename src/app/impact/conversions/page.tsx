import Link from "next/link";

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
} from "@/lib/impact/conversions";

export const dynamic =
  "force-dynamic";

function toNumber(
  value:
    | number
    | string
    | null
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

function formatDate(
  value:
    | string
    | null
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
      (
        character
      ) =>
        character.toUpperCase()
    );
}

export default async function ConversionHistoryPage() {
  const {
    conversions,
    errorMessage,
  } =
    await getConversionHistoryData();

  const totalInputKg =
    conversions.reduce(
      (
        total,
        conversion
      ) =>
        total +
        toNumber(
          conversion.kgInput
        ),
      0
    );

  const totalConvertedKg =
    conversions.reduce(
      (
        total,
        conversion
      ) =>
        total +
        toNumber(
          conversion.convertedKg
        ),
      0
    );

  const totalFullVius =
    conversions.reduce(
      (
        total,
        conversion
      ) =>
        total +
        conversion
          .fullViuCount,
      0
    );

  const totalResidualKg =
    conversions.reduce(
      (
        total,
        conversion
      ) =>
        total +
        toNumber(
          conversion
            .nonCreditableResidualKg
        ),
      0
    );

  const traceabilityReadyCount =
    conversions.filter(
      (
        conversion
      ) =>
        conversion
          .traceabilityReady
    ).length;

  return (
    <>
      <ImpactPageHeader
        title="Conversion History"
        description="Consulta las transacciones de conversión desde impacto verificado hasta los activos VIU y FVIU generados."
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
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Conversions"
          value={formatNumber(
            conversions.length
          )}
          helper={`${traceabilityReadyCount} with complete traceability`}
        />

        <ImpactMetricCard
          label="Reported impact"
          value={`${formatNumber(
            totalInputKg
          )} kg`}
          helper="Kilograms received by conversion batches"
        />

        <ImpactMetricCard
          label="Creditable impact"
          value={`${formatNumber(
            totalConvertedKg
          )} kg`}
          helper={`${formatNumber(
            totalFullVius
          )} full VIU cards generated`}
        />

        <ImpactMetricCard
          label="Non-creditable residual"
          value={`${formatNumber(
            totalResidualKg
          )} kg`}
          helper="Accumulated discard control"
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Conversion transactions"
          description="Cada registro CONV identifica una transformación de kilogramos verificados en activos digitales de impacto."
        >
          {conversions.length >
          0 ? (
            <div className="grid gap-4">
              {conversions.map(
                (
                  conversion
                ) => (
                  <article
                    key={
                      conversion
                        .conversionBatchId
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-950">
                            {
                              conversion
                                .conversionPermanentId
                            }
                          </h2>

                          <ImpactStatusPill
                            status={
                              conversion
                                .conversionStatus
                            }
                          />

                          <ImpactStatusPill
                            status={
                              conversion
                                .assetsGenerationStatus
                            }
                          />

                          <ImpactStatusPill
                            status={
                              conversion
                                .traceabilityReady
                                ? "Traceability ready"
                                : "Traceability issue"
                            }
                          />
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-700">
                          {
                            conversion
                              .scopeName
                          }
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {
                            conversion
                              .scopeCode
                          }
                          {" · "}
                          {
                            conversion
                              .scopeType
                          }
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`/impact/evidence/${conversion.evidencePackageId}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                        >
                          View source evidence
                        </Link>

                        <Link
                          href={`/impact/conversions/${conversion.conversionBatchId}`}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          View full traceability
                        </Link>


                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Source MVI
                        </dt>

                        <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                          {
                            conversion
                              .sourceVerifiedImpactPermanentId
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Period
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            conversion
                              .periodKey
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Impact line
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatLabel(
                            conversion
                              .impactLine
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Processed
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(
                            conversion
                              .createdAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Input
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-slate-950">
                          {formatNumber(
                            conversion
                              .kgInput
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Creditable
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-slate-950">
                          {formatNumber(
                            conversion
                              .convertedKg
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Full VIUs
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-slate-950">
                          {
                            conversion
                              .fullViuCount
                          }
                          {" generated · "}
                          {
                            conversion
                              .viuAssetCount
                          }
                          {" found"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Fractional VIU
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-slate-950">
                          {
                            conversion
                              .fractionalViuCents
                          }
                          {" cent_VIU · "}
                          {
                            conversion
                              .fractionalTrancheCount
                          }
                          {" tranche"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Residual
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatNumber(
                            conversion
                              .nonCreditableResidualKg
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Evidence files
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            conversion
                              .evidenceFileCount
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Import logs
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            conversion
                              .importLogCount
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          CONV UUID
                        </dt>

                        <dd className="mt-1 break-all font-mono text-xs text-slate-600">
                          {
                            conversion
                              .conversionBatchId
                          }
                        </dd>
                      </div>
                    </dl>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-900">
                No conversion transactions found.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Las conversiones aparecerán aquí después de procesar paquetes de evidencia aprobados.
              </p>
            </div>
          )}
        </ImpactSection>
      </div>
    </>
  );
}