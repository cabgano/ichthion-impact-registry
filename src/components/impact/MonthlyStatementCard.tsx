import Link from "next/link";

import type {
  MonthlyStatementListItem,
  NumericValue,
} from "@/lib/impact/monthly-statements";

type MonthlyStatementCardProps = {
  statement: MonthlyStatementListItem;
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
  value: string
) {
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

function abbreviatedHash(
  value: string
) {
  if (value.length < 24) {
    return value;
  }

  return (
    `${value.slice(0, 12)}…` +
    value.slice(-8)
  );
}

function statusClasses(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
    case "issued":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "ready_for_review":
      return "border-blue-200 bg-blue-50 text-blue-800";

    case "voided":
      return "border-red-200 bg-red-50 text-red-800";

    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function isSha256(
  value: string
) {
  return /^[0-9a-f]{64}$/.test(
    value
  );
}

export function MonthlyStatementCard({
  statement,
}: MonthlyStatementCardProps) {
  const audience =
    statement.statement_type ===
    "general"
      ? "General Registry"
      : (
          statement.client_display_name ??
          statement.client_code ??
          "Client"
        );

  const hashesPresent =
    isSha256(
      statement.source_fingerprint_hash
    ) &&
    isSha256(
      statement.statement_manifest_hash
    );

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatPeriod(
              statement.statement_period_key
            )}
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-950">
            {statement.permanent_id}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {audience}
          </p>
        </div>

        <span
          className={[
            "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            statusClasses(
              statement.statement_status
            ),
          ].join(" ")}
        >
          {statement.statement_status.replaceAll(
            "_",
            " "
          )}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Opening
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {formatNumber(
              statement.opening_total_controlled_kg
            )}
          </p>

          <p className="text-xs text-slate-500">
            kg controlled
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Period
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {formatNumber(
              statement.period_total_controlled_kg_delta
            )}
          </p>

          <p className="text-xs text-slate-500">
            kg delta
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Closing
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {formatNumber(
              statement.closing_total_controlled_kg
            )}
          </p>

          <p className="text-xs text-slate-500">
            kg controlled
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-slate-500">
            Assigned closing
          </dt>

          <dd className="font-semibold text-slate-900">
            {formatNumber(
              statement.closing_assigned_kg
            )}{" "}
            kg
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Data cutoff
          </dt>

          <dd className="font-semibold text-slate-900">
            {formatDate(
              statement.data_cutoff_at
            )}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Lines
          </dt>

          <dd className="font-semibold text-slate-900">
            {statement.actual_line_count}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Sources
          </dt>

          <dd className="font-semibold text-slate-900">
            {statement.actual_source_count}
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Evidence files
          </dt>

          <dd className="font-semibold text-slate-900">
            {
              statement.actual_evidence_file_count
            }
          </dd>
        </div>

        <div>
          <dt className="text-slate-500">
            Events
          </dt>

          <dd className="font-semibold text-slate-900">
            {statement.actual_event_count}
          </dd>
        </div>
      </dl>

      <div
        className={[
          "mt-5 rounded-xl border p-3 text-xs",
          hashesPresent
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900",
        ].join(" ")}
      >
        <p className="font-semibold">
          {hashesPresent
            ? "Hash contract present"
            : "Incomplete hash contract"}
        </p>

        <p
          className="mt-1 font-mono"
          title={
            statement.statement_manifest_hash
          }
        >
          Manifest:{" "}
          {abbreviatedHash(
            statement.statement_manifest_hash
          )}
        </p>

        <p
          className="mt-1 font-mono"
          title={
            statement.source_fingerprint_hash
          }
        >
          Sources:{" "}
          {abbreviatedHash(
            statement.source_fingerprint_hash
          )}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href={`/impact/statements/${statement.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Open monthly statement
        </Link>
      </div>
    </article>
  );
}