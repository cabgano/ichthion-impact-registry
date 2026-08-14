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
  ProcessEvidencePackageConversionButton,
} from "@/components/impact/ProcessEvidencePackageConversionButton";

import {
  getEvidenceConversionPreview,
} from "@/lib/impact/conversion-preview";

import {
  isValidEvidencePackageId,
} from "@/lib/impact/evidence-review";

type ConversionPreviewPageProps = {
  params: Promise<{
    packageId: string;
  }>;
};

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

export default async function ConversionPreviewPage({
  params,
}: ConversionPreviewPageProps) {
  const {
    packageId,
  } = await params;

  if (
    !isValidEvidencePackageId(
      packageId
    )
  ) {
    notFound();
  }

  const {
    preview,
    errorMessage,
  } =
    await getEvidenceConversionPreview(
      packageId
    );

  if (!preview) {
    return (
      <>
        <div className="mb-4">
          <Link
            href={`/impact/evidence/${packageId}`}
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← Back to evidence package
          </Link>
        </div>

        <ImpactPageHeader
          title="Conversion Preview"
          description="No se pudo generar la previsualización solicitada."
        >
          <ImpactStatusPill
            status="warning"
          />
        </ImpactPageHeader>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage ??
            "Conversion preview unavailable."}
        </div>
      </>
    );
  }

  const hasFractionalTranche =
    preview
      .fractional_viu_cents >
    0;

  const hasResidual =
    toNumber(
      preview
        .non_creditable_residual_kg
    ) > 0;

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/impact/evidence/${packageId}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to evidence package
        </Link>
      </div>

      <ImpactPageHeader
        title="Conversion Preview"
        description={`Previsualización del procesamiento de ${preview.package_permanent_id}. Ningún activo ha sido creado todavía.`}
      >
        <ImpactStatusPill
          status={
            preview
              .verification_status
          }
        />

        <ImpactStatusPill
          status="Preview only"
        />
      </ImpactPageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Reported impact"
          value={`${formatNumber(
            preview.reported_kg
          )} kg`}
          helper="Impacto reportado en el paquete"
        />

        <ImpactMetricCard
          label="Creditable impact"
          value={`${formatNumber(
            preview.creditable_kg
          )} kg`}
          helper="Impacto que generará VIU"
        />

        <ImpactMetricCard
          label="Full VIUs"
          value={formatNumber(
            preview.full_viu_count
          )}
          helper="Tarjetas completas previstas"
        />

        <ImpactMetricCard
          label="Fractional cent_VIUs"
          value={formatNumber(
            preview
              .fractional_viu_cents
          )}
          helper={
            hasFractionalTranche
              ? "Se generará un tramo FVIU"
              : "No se generará tramo FVIU"
          }
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Source package"
          description="Paquete de evidencia aprobado que será utilizado como fuente de la conversión."
        >
          <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Package
              </dt>

              <dd className="mt-1 text-sm font-bold text-slate-950">
                {
                  preview
                    .package_permanent_id
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Period
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {
                  preview
                    .period_key
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Impact line
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatLabel(
                  preview
                    .impact_line
                )}
              </dd>
            </div>

            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {
                  preview
                    .scope_name
                }
              </dd>

              <dd className="mt-1 font-mono text-xs text-slate-500">
                {
                  preview
                    .scope_code
                }
                {" · "}
                {
                  preview
                    .scope_type
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current status
              </dt>

              <dd className="mt-1 flex flex-wrap gap-2">
                <ImpactStatusPill
                  status={
                    preview
                      .verification_status
                  }
                />

                <ImpactStatusPill
                  status={
                    preview
                      .import_status
                  }
                />
              </dd>
            </div>
          </dl>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Planned conversion"
          description="Resultado previsto utilizando 1 VIU por cada 1.000 kg y 1 cent_VIU por cada 10 kg acreditables."
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid gap-1 border-b border-slate-200 bg-slate-50 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Reported kilograms
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview.reported_kg
                )}{" "}
                kg
              </strong>
            </div>

            <div className="grid gap-1 border-b border-slate-200 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Creditable kilograms
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview
                    .creditable_kg
                )}{" "}
                kg
              </strong>
            </div>

            <div className="grid gap-1 border-b border-slate-200 bg-slate-50 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Total VIU amount
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview
                    .viu_amount
                )}{" "}
                VIU
              </strong>
            </div>

            <div className="grid gap-1 border-b border-slate-200 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Full VIU cards
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview
                    .full_viu_count
                )}
              </strong>
            </div>

            <div className="grid gap-1 border-b border-slate-200 bg-slate-50 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Fractional cent_VIUs
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview
                    .fractional_viu_cents
                )}
              </strong>
            </div>

            <div className="grid gap-1 px-5 py-4 md:grid-cols-2">
              <span className="text-sm text-slate-600">
                Non-creditable residual
              </span>

              <strong className="text-sm text-slate-950 md:text-right">
                {formatNumber(
                  preview
                    .non_creditable_residual_kg
                )}{" "}
                kg
              </strong>
            </div>
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Residual control"
          description="Los residuales se acumulan como material no acreditable y nunca se convierten posteriormente en VIU o cent_VIU."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Accumulated before
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatNumber(
                  preview
                    .accumulated_non_creditable_residual_before_kg
                )}{" "}
                kg
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Generated by this package
              </p>

              <p className="mt-2 text-xl font-bold text-amber-950">
                {formatNumber(
                  preview
                    .non_creditable_residual_kg
                )}{" "}
                kg
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Projected accumulated total
              </p>

              <p className="mt-2 text-xl font-bold text-slate-950">
                {formatNumber(
                  preview
                    .accumulated_non_creditable_residual_after_kg
                )}{" "}
                kg
              </p>
            </div>
          </div>

          {hasResidual ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This package will generate non-creditable residual material. It will be recorded for control and future discard reporting, but it will not produce digital assets.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              This package produces no non-creditable residual.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-950">
              Confirm import and conversion
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              This action will atomically import the verified impact, register its wallet movements, create the conversion batch and generate its Level 2 assets.
            </p>

            <p className="mt-2 max-w-2xl text-xs text-slate-500">
              The package will generate one verified kg import movement, one conversion movement, its corresponding CONV record and the applicable VIU or FVIU assets.
            </p>
          </div>

          <ProcessEvidencePackageConversionButton
            packageId={
              preview.package_id
            }
            permanentId={
              preview
                .package_permanent_id
            }
            reportedKg={
              preview.reported_kg
            }
            fullViuCount={
              preview.full_viu_count
            }
            fractionalViuCents={
              preview
                .fractional_viu_cents
            }
            residualKg={
              preview
                .non_creditable_residual_kg
            }
          />
        </div>
      </div>
    </>
  );
}