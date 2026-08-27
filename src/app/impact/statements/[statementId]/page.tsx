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
  MonthlyStatementIntegrityPanel,
} from "@/components/impact/MonthlyStatementIntegrityPanel";

import {
  MonthlyStatementLinesTable,
} from "@/components/impact/MonthlyStatementLinesTable";

import {
  getMonthlyImpactStatementDetail,
  type NumericValue,
} from "@/lib/impact/monthly-statements";

import {
  getCurrentImpactUserPermissions,
} from "@/lib/impact/permissions";

type MonthlyStatementPageProps = {
  params: Promise<{
    statementId: string;
  }>;
};

function formatNumber(
  value: NumericValue
) {
  const numeric =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 5,
    }
  ).format(
    Number.isFinite(numeric)
      ? numeric
      : 0
  );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatPeriod(
  periodKey: string
) {
  if (
    !/^\d{6}$/.test(
      periodKey
    )
  ) {
    return periodKey;
  }

  const year =
    Number(
      periodKey.slice(0, 4)
    );

  const month =
    Number(
      periodKey.slice(4, 6)
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        1
      )
    )
  );
}

export default async function MonthlyStatementPage({
  params,
}: MonthlyStatementPageProps) {
  const [
    routeParams,
    permissions,
  ] = await Promise.all([
    params,
    getCurrentImpactUserPermissions(),
  ]);

  if (
    permissions.impact_role !== "impact_admin" &&
    permissions.impact_role !== "technical_admin"
  ) {
    return (
      <>
        <ImpactPageHeader
          title="Monthly Statement"
          description="Frozen monthly impact results and audit traceability."
        >
          <ImpactStatusPill
            status="restricted"
          />
        </ImpactPageHeader>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          This section is currently restricted to active impact administrators.
        </div>
      </>
    );
  }

  const detail =
    await getMonthlyImpactStatementDetail(
      routeParams.statementId
    );

  if (
    !detail.statement &&
    !detail.errorMessage
  ) {
    notFound();
  }

  if (!detail.statement) {
    return (
      <>
        <div className="mb-4">
          <Link
            href="/impact/statements"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← Back to monthly statements
          </Link>
        </div>

        <ImpactPageHeader
          title="Monthly Statement"
          description="The requested statement could not be loaded."
        >
          <ImpactStatusPill
            status="error"
          />
        </ImpactPageHeader>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {
            detail.errorMessage ??
            "The requested statement is unavailable."
          }
        </div>
      </>
    );
  }

  const statement =
    detail.statement;

  const audience =
    statement.statement_type ===
    "general"
      ? "General Registry"
      : (
          statement.client_display_name ??
          statement.client_code ??
          "Client"
        );

  return (
    <>
      <div className="mb-4">
        <Link
          href="/impact/statements"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to monthly statements
        </Link>
      </div>

      <ImpactPageHeader
        eyebrow={formatPeriod(
          statement.statement_period_key
        )}
        title={
          statement.permanent_id
        }
        description={`${audience} · Version ${statement.statement_version} · Immutable monthly impact snapshot`}
      >
        <ImpactStatusPill
          status={
            statement.statement_status
          }
        />
      </ImpactPageHeader>

      {detail.errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>
            Some statement details could not be loaded.
          </strong>

          <p className="mt-1">
            {
              detail.errorMessage
            }
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Opening controlled"
          value={formatNumber(
            statement.opening_total_controlled_kg
          )}
          helper="kg at period opening"
        />

        <ImpactMetricCard
          label="Period activity"
          value={formatNumber(
            statement.period_total_controlled_kg_delta
          )}
          helper="kg controlled delta"
        />

        <ImpactMetricCard
          label="Closing controlled"
          value={formatNumber(
            statement.closing_total_controlled_kg
          )}
          helper="kg at period closing"
        />

        <ImpactMetricCard
          label="Closing assigned"
          value={formatNumber(
            statement.closing_assigned_kg
          )}
          helper="kg assigned to clients"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ImpactSection
          title="Statement Overview"
          description="Identity, audience, period and frozen source counts."
        >
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Audience
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {audience}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Statement type
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {
                  statement.statement_type
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Period start
              </dt>

              <dd className="mt-1 text-sm text-slate-800">
                {formatDate(
                  statement.period_start_at
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Period end
              </dt>

              <dd className="mt-1 text-sm text-slate-800">
                {formatDate(
                  statement.period_end_at
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Data cutoff
              </dt>

              <dd className="mt-1 text-sm text-slate-800">
                {formatDate(
                  statement.data_cutoff_at
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Generated
              </dt>

              <dd className="mt-1 text-sm text-slate-800">
                {formatDate(
                  statement.generated_at
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sources
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {
                  statement.source_movement_count
                }{" "}
                movements
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evidence
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {
                  statement.evidence_package_count
                }{" "}
                packages
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                VIU assets
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {
                  statement.viu_asset_count
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Allocations
              </dt>

              <dd className="mt-1 text-sm font-semibold text-slate-950">
                {
                  statement.allocation_count
                }
              </dd>
            </div>
          </dl>
        </ImpactSection>

        <ImpactSection
          title="Closing Balance"
          description="Frozen closing composition of the monthly statement."
        >
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Verified
              </dt>

              <dd className="mt-1 text-lg font-bold text-slate-950">
                {formatNumber(
                  statement.closing_verified_kg
                )}{" "}
                kg
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Spendable
              </dt>

              <dd className="mt-1 text-lg font-bold text-slate-950">
                {formatNumber(
                  statement.closing_spendable_kg
                )}{" "}
                kg
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Residual
              </dt>

              <dd className="mt-1 text-lg font-bold text-slate-950">
                {formatNumber(
                  statement.closing_residual_kg
                )}{" "}
                kg
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned
              </dt>

              <dd className="mt-1 text-lg font-bold text-slate-950">
                {formatNumber(
                  statement.closing_assigned_kg
                )}{" "}
                kg
              </dd>
            </div>
          </dl>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Integrity Contract"
          description="Frontend verification of the frozen snapshot, evidence hashes and event-chain links."
        >
          <MonthlyStatementIntegrityPanel
            statement={statement}
            integrity={
              detail.integrity
            }
          />
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Statement Lines"
          description="Opening, period and closing balances broken down by impact line, reporting scope and methodology."
        >
          <MonthlyStatementLinesTable
            lines={detail.lines}
          />
        </ImpactSection>
      </div>
    </>
  );
}