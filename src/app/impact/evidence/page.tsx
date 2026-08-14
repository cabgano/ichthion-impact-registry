import Link from "next/link";

import {
  ApproveEvidencePackageButton,
} from "@/components/impact/ApproveEvidencePackageButton";

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
  getApprovedEvidencePackagesData,
} from "@/lib/impact/approved-evidence";

import {
  getPendingEvidencePackagesData,
  type EvidenceIntegrityStatus,
} from "@/lib/impact/evidence-review";

import {
  getCurrentImpactUserPermissions,
} from "@/lib/impact/permissions";

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
  const [
    permissions,
    pendingData,
    approvedData,
  ] = await Promise.all([
    getCurrentImpactUserPermissions(),

    getPendingEvidencePackagesData(),

    getApprovedEvidencePackagesData(),
  ]);

  const pendingPackages =
    pendingData.packages;

  const approvedPackages =
    approvedData.packages;

  const errorMessages = [
    pendingData.errorMessage,
    approvedData.errorMessage,
  ].filter(
    (
      message
    ): message is string =>
      Boolean(message)
  );

  const totalPendingKg =
    pendingPackages.reduce(
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

  const totalApprovedKg =
    approvedPackages.reduce(
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

  const totalQueueKg =
    totalPendingKg +
    totalApprovedKg;

  const attentionCount =
    pendingPackages.filter(
      (evidencePackage) =>
        evidencePackage
          .integrity
          .integrityStatus !==
        "ready"
    ).length;

  return (
    <>
      <ImpactPageHeader
        title="Evidence Review"
        description="Revisa los paquetes pendientes y continúa los paquetes aprobados hacia su conversión en VIU."
      >
        <ImpactStatusPill
          status={
            errorMessages.length >
            0
              ? "warning"
              : "connected"
          }
        />
      </ImpactPageHeader>

      {errorMessages.length >
      0 ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>
            No se pudieron cargar todos los datos.
          </strong>

          <ul className="mt-2 list-inside list-disc space-y-1">
            {errorMessages.map(
              (
                errorMessage
              ) => (
                <li
                  key={
                    errorMessage
                  }
                >
                  {errorMessage}
                </li>
              )
            )}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Pending review"
          value={formatNumber(
            pendingPackages.length
          )}
          helper="Draft and not imported"
        />

        <ImpactMetricCard
          label="Approved for conversion"
          value={formatNumber(
            approvedPackages.length
          )}
          helper="Verified and not imported"
        />

        <ImpactMetricCard
          label="Active queue impact"
          value={`${formatNumber(
            totalQueueKg
          )} kg`}
          helper="Pending review plus approved"
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
          title="Approved for conversion"
          description="Paquetes verificados que todavía no han sido importados ni convertidos en activos VIU."
        >
          {approvedPackages.length >
          0 ? (
            <div className="grid gap-4">
              {approvedPackages.map(
                (
                  evidencePackage
                ) => (
                  <article
                    key={
                      evidencePackage.id
                    }
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-emerald-950">
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
                            status="Ready for conversion"
                          />
                        </div>

                        <p className="mt-2 text-sm text-emerald-800">
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

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link
                          href={`/impact/evidence/${evidencePackage.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                        >
                          View package
                        </Link>

                        {permissions
                          .can_convert_kg_to_viu ? (
                          <Link
                            href={`/impact/evidence/${evidencePackage.id}/conversion-preview`}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                          >
                            Preview conversion
                          </Link>
                        ) : null}
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Period
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-emerald-950">
                          {
                            evidencePackage
                              .periodKey
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Impact line
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-emerald-950">
                          {formatImpactLine(
                            evidencePackage
                              .impactLine
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Reported kg
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-emerald-950">
                          {formatNumber(
                            evidencePackage
                              .totalReportedKg
                          )}{" "}
                          kg
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Approved
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-emerald-950">
                          {formatDate(
                            evidencePackage
                              .verifiedAt
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Scope type
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-emerald-950">
                          {
                            evidencePackage
                              .scopeType
                          }
                        </dd>
                      </div>

                      <div className="sm:col-span-2 xl:col-span-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Package UUID
                        </dt>

                        <dd className="mt-1 break-all font-mono text-xs text-emerald-900">
                          {
                            evidencePackage.id
                          }
                        </dd>
                      </div>
                    </dl>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-8 text-center">
              <p className="font-semibold text-emerald-950">
                No packages approved for conversion.
              </p>

              <p className="mt-2 text-sm text-emerald-700">
                Los paquetes aparecerán aquí después de ser aprobados y antes de ser importados.
              </p>
            </div>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Pending evidence packages"
          description="Selecciona un paquete para inspeccionar sus datos, documentos y verificación de integridad."
        >
          {pendingPackages.length >
          0 ? (
            <div className="grid gap-4">
              {pendingPackages.map(
                (
                  evidencePackage
                ) => {
                  const integrityReady =
                    evidencePackage
                      .integrity
                      .integrityStatus ===
                    "ready";

                  return (
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

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            href={`/impact/evidence/${evidencePackage.id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                          >
                            Review package
                          </Link>

                          {permissions
                            .can_verify_evidence ? (
                            <ApproveEvidencePackageButton
                              packageId={
                                evidencePackage.id
                              }
                              permanentId={
                                evidencePackage
                                  .permanentId
                              }
                              disabled={
                                !integrityReady
                              }
                              disabledReason="All document integrity checks must be complete before approval."
                            />
                          ) : null}
                        </div>
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
                  );
                }
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