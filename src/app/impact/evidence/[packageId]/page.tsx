import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  ApproveEvidencePackageButton,
} from "@/components/impact/ApproveEvidencePackageButton";

import {
  EvidenceDocumentActions,
} from "@/components/impact/EvidenceDocumentActions";

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
  getEvidencePackageReviewData,
  isValidEvidencePackageId,
} from "@/lib/impact/evidence-review";

import {
  getCurrentImpactUserPermissions,
} from "@/lib/impact/permissions";

type EvidencePackageReviewPageProps = {
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

function formatDate(
  value: string | null
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

function formatBytes(
  value:
    | number
    | string
    | null
) {
  const bytes =
    toNumber(value);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
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

function userLabel(
  name: string | null,
  id: string | null
) {
  if (name) {
    return name;
  }

  if (id) {
    return id;
  }

  return "Unknown user";
}

export default async function EvidencePackageReviewPage({
  params,
}: EvidencePackageReviewPageProps) {
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

  const [
    reviewData,
    permissions,
  ] = await Promise.all([
    getEvidencePackageReviewData(
      packageId
    ),

    getCurrentImpactUserPermissions(),
  ]);

  const {
    evidencePackage,
    errorMessage,
  } = reviewData;

  if (
    !evidencePackage &&
    !errorMessage
  ) {
    notFound();
  }

  if (!evidencePackage) {
    return (
      <>
        <ImpactPageHeader
          title="Evidence Package"
          description="No se pudo recuperar el paquete solicitado."
        >
          <ImpactStatusPill
            status="warning"
          />
        </ImpactPageHeader>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      </>
    );
  }

  const integrity =
    evidencePackage.integrity;

  const integrityReady =
    integrity.integrityStatus ===
    "ready";

  const packageCanBeApproved =
    evidencePackage
      .verificationStatus ===
      "draft" &&
    evidencePackage
      .importStatus ===
      "not_imported";

  const packageIsApproved =
    evidencePackage
      .verificationStatus ===
    "verified";

  return (
    <>
      <div className="mb-4">
        <Link
          href="/impact/evidence"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to evidence review
        </Link>
      </div>

      <ImpactPageHeader
        title={
          evidencePackage
            .permanentId
        }
        description="Revisión de la información reportada, documentos cargados y controles de integridad del paquete."
      >
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
            integrityReady
              ? "Integrity ready"
              : "Needs attention"
          }
        />
      </ImpactPageHeader>

      {permissions.can_verify_evidence &&
      packageCanBeApproved ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-emerald-950">
                Approval for conversion
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                Approve this package after reviewing the evidence and confirming that the required external verification has been received.
              </p>

              <p className="mt-2 text-xs text-emerald-700">
                This approval will not create VIUs or import kilograms yet.
              </p>
            </div>

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
              disabledReason="The package cannot be approved until all integrity checks are confirmed."
            />
          </div>
        </div>
      ) : null}

      {packageIsApproved ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-emerald-950">
                Approved for conversion
              </p>

              <p className="mt-1 text-sm text-emerald-800">
                This package has been verified and may continue to the conversion preview.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ImpactStatusPill
                status="verified"
              />

              <Link
                href={`/impact/evidence/${evidencePackage.id}/conversion-preview`}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Preview conversion
              </Link>
            </div>
          </div>

          <p className="mt-3 text-xs text-emerald-700">
            No VIUs, fractional VIUs or wallet movements have been created yet.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Reported impact"
          value={`${formatNumber(
            evidencePackage
              .totalReportedKg
          )} kg`}
          helper={
            packageIsApproved
              ? "Approved, not imported"
              : "Todavía no importado"
          }
        />

        <ImpactMetricCard
          label="Documents"
          value={formatNumber(
            integrity.documentCount
          )}
          helper={`${integrity.lineReportCount} main report`}
        />

        <ImpactMetricCard
          label="Hashes confirmed"
          value={`${integrity.matchingHashCount}/${integrity.documentCount}`}
          helper="Double SHA-256 checks"
        />

        <ImpactMetricCard
          label="Integrity issues"
          value={formatNumber(
            integrity.issueCount
          )}
          helper={
            integrityReady
              ? "Ready for administrative review"
              : "Requires attention"
          }
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Package information"
          description="Información registrada por el administrador de impacto al crear el paquete."
        >
          <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Package UUID
              </dt>

              <dd className="mt-1 break-all font-mono text-sm text-slate-900">
                {evidencePackage.id}
              </dd>
            </div>

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
                {formatLabel(
                  evidencePackage
                    .impactLine
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scope
              </dt>

              <dd className="mt-1 text-sm font-medium text-slate-900">
                {
                  evidencePackage
                    .scopeName
                }
              </dd>

              <dd className="text-xs text-slate-500">
                {
                  evidencePackage
                    .scopeCode
                }
                {" · "}
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

              <dd className="mt-1 break-all text-sm font-medium text-slate-900">
                {userLabel(
                  evidencePackage
                    .createdByName,
                  evidencePackage
                    .createdBy
                )}
              </dd>
            </div>

            <div>
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

            <div className="md:col-span-2 xl:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Impact description
              </dt>

              <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {
                  evidencePackage
                    .impactDescription ??
                  "No description registered."
                }
              </dd>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Internal notes
              </dt>

              <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {
                  evidencePackage
                    .notes ??
                  "No internal notes."
                }
              </dd>
            </div>
          </dl>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Integrity summary"
          description="Este resumen confirma disponibilidad e integridad digital; todavía no representa por sí solo la aprobación del impacto."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label:
                  "Main report present",

                value:
                  integrity.lineReportCount ===
                  1,
              },
              {
                label:
                  "All files hashed",

                value:
                  integrity.hashVerifiedCount ===
                    integrity.documentCount &&
                  integrity.documentCount >
                    0,
              },
              {
                label:
                  "All hashes match",

                value:
                  integrity.matchingHashCount ===
                    integrity.documentCount &&
                  integrity.documentCount >
                    0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={[
                  "rounded-xl border p-4",

                  item.value
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {item.value
                    ? "Confirmed"
                    : "Requires attention"}
                </p>
              </div>
            ))}
          </div>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Evidence documents"
          description="Documentos registrados dentro del paquete y sus resultados de integridad."
        >
          {evidencePackage
            .files.length > 0 ? (
            <div className="grid gap-4">
              {evidencePackage
                .files.map(
                  (file) => (
                    <article
                      key={file.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">
                              {
                                file.fileName
                              }
                            </h3>

                            <ImpactStatusPill
                              status={
                                file.fileRole
                              }
                            />

                            <ImpactStatusPill
                              status={
                                file.hashMatch
                                  ? "Hash confirmed"
                                  : "Hash issue"
                              }
                            />
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            {
                              file.description ??
                              "No document description."
                            }
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-slate-600">
                          {formatBytes(
                            file.fileSizeBytes
                          )}
                        </div>
                      </div>

                      <dl className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            MIME type
                          </dt>

                          <dd className="mt-1 text-sm text-slate-900">
                            {
                              file.mimeType ??
                              "Not registered"
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Uploaded
                          </dt>

                          <dd className="mt-1 text-sm text-slate-900">
                            {formatDate(
                              file.uploadedAt
                            )}
                          </dd>
                        </div>

                        <div className="md:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Uploaded by
                          </dt>

                          <dd className="mt-1 break-all text-sm text-slate-900">
                            {userLabel(
                              file.uploadedByName,
                              file.uploadedBy
                            )}
                          </dd>
                        </div>

                        <div className="md:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Declared SHA-256
                          </dt>

                          <dd className="mt-1 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                            {
                              file.declaredSha256 ??
                              "Not available"
                            }
                          </dd>
                        </div>

                        <div className="md:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Calculated SHA-256
                          </dt>

                          <dd className="mt-1 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                            {
                              file.calculatedSha256 ??
                              "Not available"
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Hash verified
                          </dt>

                          <dd className="mt-1 text-sm text-slate-900">
                            {formatDate(
                              file.hashVerifiedAt
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Storage path
                          </dt>

                          <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                            {
                              file.storagePath
                            }
                          </dd>
                        </div>
                      </dl>

                      <EvidenceDocumentActions
                        fileId={file.id}
                        fileName={
                          file.fileName
                        }
                      />
                    </article>
                  )
                )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No documents registered.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}