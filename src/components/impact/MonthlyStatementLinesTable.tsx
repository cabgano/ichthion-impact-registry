import type {
  MonthlyStatementLine,
  NumericValue,
} from "@/lib/impact/monthly-statements";

type MonthlyStatementLinesTableProps = {
  lines: MonthlyStatementLine[];
};

function numberValue(
  value: NumericValue
) {
  const numeric =
    Number(value ?? 0);

  return Number.isFinite(numeric)
    ? numeric
    : 0;
}

function formatNumber(
  value: NumericValue
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 5,
    }
  ).format(
    numberValue(value)
  );
}

function formatViuCents(
  cents: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(cents / 100);
}

export function MonthlyStatementLinesTable({
  lines,
}: MonthlyStatementLinesTableProps) {
  const totals =
    lines.reduce(
      (result, line) => ({
        opening:
          result.opening +
          numberValue(
            line.opening_total_controlled_kg
          ),

        period:
          result.period +
          numberValue(
            line.period_total_controlled_kg_delta
          ),

        closing:
          result.closing +
          numberValue(
            line.closing_total_controlled_kg
          ),

        spendableCents:
          result.spendableCents +
          line.closing_spendable_viu_cents,

        assignedCents:
          result.assignedCents +
          line.closing_assigned_viu_cents,

        sources:
          result.sources +
          line.source_movement_count,
      }),
      {
        opening: 0,
        period: 0,
        closing: 0,
        spendableCents: 0,
        assignedCents: 0,
        sources: 0,
      }
    );

  if (lines.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No statement lines are available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-[1180px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">
              Scope
            </th>

            <th className="px-4 py-3">
              Classification
            </th>

            <th className="px-4 py-3 text-right">
              Opening kg
            </th>

            <th className="px-4 py-3 text-right">
              Period kg
            </th>

            <th className="px-4 py-3 text-right">
              Closing kg
            </th>

            <th className="px-4 py-3 text-right">
              Spendable VIU
            </th>

            <th className="px-4 py-3 text-right">
              Assigned VIU
            </th>

            <th className="px-4 py-3 text-right">
              Sources
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {lines.map(
            (line) => (
              <tr
                key={line.id}
                className="align-top"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">
                    {line.scope_name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {line.scope_code}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {line.impact_line} ·{" "}
                    {line.scope_type}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {
                      line.balance_class
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {line.methodology_code ??
                      "No methodology"}
                  </p>

                  {line.methodology_version ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Version{" "}
                      {
                        line.methodology_version
                      }
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {formatNumber(
                    line.opening_total_controlled_kg
                  )}
                </td>

                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {formatNumber(
                    line.period_total_controlled_kg_delta
                  )}
                </td>

                <td className="px-4 py-3 text-right font-semibold text-slate-950">
                  {formatNumber(
                    line.closing_total_controlled_kg
                  )}
                </td>

                <td className="px-4 py-3 text-right text-slate-800">
                  {formatViuCents(
                    line.closing_spendable_viu_cents
                  )}
                </td>

                <td className="px-4 py-3 text-right text-slate-800">
                  {formatViuCents(
                    line.closing_assigned_viu_cents
                  )}
                </td>

                <td className="px-4 py-3 text-right text-slate-800">
                  {
                    line.source_movement_count
                  }
                </td>
              </tr>
            )
          )}
        </tbody>

        <tfoot className="border-t border-slate-300 bg-slate-100">
          <tr className="font-semibold text-slate-950">
            <td
              colSpan={2}
              className="px-4 py-3"
            >
              Statement totals
            </td>

            <td className="px-4 py-3 text-right">
              {formatNumber(
                totals.opening
              )}
            </td>

            <td className="px-4 py-3 text-right">
              {formatNumber(
                totals.period
              )}
            </td>

            <td className="px-4 py-3 text-right">
              {formatNumber(
                totals.closing
              )}
            </td>

            <td className="px-4 py-3 text-right">
              {formatViuCents(
                totals.spendableCents
              )}
            </td>

            <td className="px-4 py-3 text-right">
              {formatViuCents(
                totals.assignedCents
              )}
            </td>

            <td className="px-4 py-3 text-right">
              {totals.sources}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}