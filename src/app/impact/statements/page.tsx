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
  MonthlyStatementCard,
} from "@/components/impact/MonthlyStatementCard";

import {
  getMonthlyImpactStatementsData,
} from "@/lib/impact/monthly-statements";

import {
  getCurrentImpactUserPermissions,
} from "@/lib/impact/permissions";

type MonthlyStatementsPageProps = {
  searchParams: Promise<{
    period?:
      | string
      | string[];

    type?:
      | string
      | string[];

    status?:
      | string
      | string[];
  }>;
};

function firstParameter(
  value:
    | string
    | string[]
    | undefined
) {
  return Array.isArray(value)
    ? value[0]
    : value ?? "";
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(value);
}

export default async function MonthlyStatementsPage({
  searchParams,
}: MonthlyStatementsPageProps) {
  const permissions =
    await getCurrentImpactUserPermissions();

  if (

    permissions.impact_role !== "impact_admin" &&
    permissions.impact_role !== "technical_admin"

  ) {
    return (
      <>
        <ImpactPageHeader
          title="Monthly Statements"
          description="Frozen monthly impact results and their audit traceability."
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

  const [
    query,
    statementData,
  ] = await Promise.all([
    searchParams,
    getMonthlyImpactStatementsData(),
  ]);

  const selectedPeriod =
    firstParameter(
      query.period
    );

  const selectedType =
    firstParameter(
      query.type
    );

  const selectedStatus =
    firstParameter(
      query.status
    );

  const filteredStatements =
    statementData.statements.filter(
      (statement) => {
        if (
          selectedPeriod &&
          statement.statement_period_key !==
            selectedPeriod
        ) {
          return false;
        }

        if (
          selectedType &&
          statement.statement_type !==
            selectedType
        ) {
          return false;
        }

        if (
          selectedStatus &&
          statement.statement_status !==
            selectedStatus
        ) {
          return false;
        }

        return true;
      }
    );

  const generalCount =
    statementData.statements.filter(
      (statement) =>
        statement.statement_type ===
        "general"
    ).length;

  const clientCount =
    statementData.statements.filter(
      (statement) =>
        statement.statement_type ===
        "client"
    ).length;

  const totalSources =
    statementData.statements.reduce(
      (total, statement) =>
        total +
        statement.actual_source_count,
      0
    );

  return (
    <>
      <ImpactPageHeader
        title="Monthly Statements"
        description="Frozen general and client-level monthly results with reproducible sources, evidence and lifecycle history."
      >
        <ImpactStatusPill
          status={
            statementData.errorMessage
              ? "warning"
              : "ok"
          }
        />
      </ImpactPageHeader>

      {statementData.errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <strong>
            Monthly statements could not be loaded.
          </strong>

          <p className="mt-1">
            {
              statementData.errorMessage
            }
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Statements"
          value={formatNumber(
            statementData.statements.length
          )}
          helper="Frozen monthly records"
        />

        <ImpactMetricCard
          label="General"
          value={formatNumber(
            generalCount
          )}
          helper="Registry-wide statements"
        />

        <ImpactMetricCard
          label="Client"
          value={formatNumber(
            clientCount
          )}
          helper="Client-specific statements"
        />

        <ImpactMetricCard
          label="Source snapshots"
          value={formatNumber(
            totalSources
          )}
          helper="Frozen movement provenance"
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Filters"
          description="Filter the monthly statement gallery without changing the underlying snapshots."
        >
          <form
            method="get"
            className="grid gap-4 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto_auto]"
          >
            <label className="text-sm font-medium text-slate-700">
              Period

              <select
                name="period"
                defaultValue={
                  selectedPeriod
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
              >
                <option value="">
                  All periods
                </option>

                {statementData.periodKeys.map(
                  (periodKey) => (
                    <option
                      key={
                        periodKey
                      }
                      value={
                        periodKey
                      }
                    >
                      {periodKey}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Audience

              <select
                name="type"
                defaultValue={
                  selectedType
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
              >
                <option value="">
                  All audiences
                </option>

                <option value="general">
                  General
                </option>

                <option value="client">
                  Client
                </option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status

              <select
                name="status"
                defaultValue={
                  selectedStatus
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
              >
                <option value="">
                  All statuses
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="ready_for_review">
                  Ready for review
                </option>

                <option value="issued">
                  Issued
                </option>

                <option value="voided">
                  Voided
                </option>
              </select>
            </label>

            <button
              type="submit"
              className="self-end rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply
            </button>

            <Link
              href="/impact/statements"
              className="self-end rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </form>
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Statement Gallery"
          description={`${filteredStatements.length} statement(s) match the current filters.`}
        >
          {filteredStatements.length >
          0 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredStatements.map(
                (statement) => (
                  <MonthlyStatementCard
                    key={
                      statement.id
                    }
                    statement={
                      statement
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-800">
                No monthly statements found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Clear the filters or generate a new monthly draft once the generation action is enabled.
              </p>
            </div>
          )}
        </ImpactSection>
      </div>
    </>
  );
}