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
  getPendingEvidencePackagesData,
  type EvidenceIntegrityStatus,
} from "@/lib/impact/evidence-review";

function toNumber(
  value:
    | number
    | string
    | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  const numericValue =
    Number(value);

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
  value: string
) {
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

function formatImpactLine(
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

function getIntegrityLabel(
  status:
    EvidenceIntegrityStatus
) {
  if (status === "ready") {
    return "Integrity ready";
  }

  if (status === "issue") {
    return "Integrity issue";
  }

  return "Incomplete";
}

function getCreatorLabel(
  fullName: string | null,
  userId: string | null
) {
  if (fullName) {
    return fullName;
  }

  if (userId) {
    return `${userId.slice(
      0,
      8
    )}…`;
  }

  return "Unknown user";
}

export default async function EvidenceReviewPage() {
  const {
    packages,
    errorMessage,
  } =
    await getPendingEvidencePackagesData();

  const totalReportedKg =
    packages.reduce(
      (
        total,
        evidencePackage
      ) =>
        total +
        toNumber(
          evidencePackage
            .totalReportedKg
        ),
      0
    );

  const readyCount =
    packages.filter(
      (evidencePackage) =>
        evidencePackage
          .integrity
          .integrityStatus ===
        "ready"
    ).length;

  const attentionCount =
    packages.length -
    readyCount;

  return (
    <>
      <ImpactPageHeader
        title="Evidence Review"
        description="Paquetes de evidencia que todavía deben ser inspeccionados, verificados externamente y procesados."
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
            No se pudieron cargar todos los datos.
          </strong>

          <p className="mt-1">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Pending packages"
          value={formatNumber(
            packages.length
          )}
          helper="Draft and not imported"
        />

        <ImpactMetricCard
          label="Reported impact"
          value={`${formatNumber(
            totalReportedKg
          )} kg`}
          helper="Total pendiente de revisión"
        />

        <ImpactMetricCard
          label="Integrity ready"
          value={formatNumber(
            readyCount
          )}
          helper="Todos los hashes coinciden"
        />

        <ImpactMetricCard
          label="Needs attention"
          value={formatNumber(
            attentionCount
          )}
          helper="Integridad incompleta o con problemas"
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Pending evidence packages"
          description="Selecciona un paquete para inspeccionar sus datos, documentos y verificación de integridad."
        >
          {packages.length > 0 ? (
            <div className="grid gap-4">
              {packages.map(
                (
                  evidencePackage
                ) => (
                  <article
                    key={
                      evidencePackage.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-950">
                            {
                              evidencePackage
                                .permanentId
                            }
                          </h2>

                          <ImpactStatusPill
                            status={
                              evidencePackage
                                .verificationStatus
                            }
                          />

                          <ImpactStatusPill
                            status={
                              evidencePackage
                                .importStatus
                            }
                          />

                          <ImpactStatusPill
                            status={
                              getIntegrityLabel(
                                evidencePackage
                                  .integrity
                                  .integrityStatus
                              )
                            }
                          />
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {
                            evidencePackage
                              .scopeName
                          }
                          {" · "}
                          {
                            evidencePackage
                              .scopeCode
                          }
                        </p>
                      </div>

                      <Link
                        href={`/impact/evidence/${evidencePackage.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Review package
                      </Link>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Period
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            evidencePackage
                              .periodKey
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Impact line
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatImpactLine(
                            evidencePackage
                              .impactLine
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Reported kg
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatNumber(
                            evidencePackage
                              .totalReportedKg
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Documents
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            evidencePackage
                              .integrity
                              .documentCount
                          }
                          {" · "}
                          {
                            evidencePackage
                              .integrity
                              .matchingHashCount
                          }{" "}
                          hashes confirmed
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Scope type
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {
                            evidencePackage
                              .scopeType
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Created by
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {getCreatorLabel(
                            evidencePackage
                              .createdByName,
                            evidencePackage
                              .createdBy
                          )}
                        </dd>
                      </div>

                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Created
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {formatDate(
                            evidencePackage
                              .createdAt
                          )}
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
                No pending evidence packages.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Los paquetes nuevos aparecerán aquí mientras estén en estado draft y not_imported.
              </p>
            </div>
          )}
        </ImpactSection>
      </div>
    </>
  );
}