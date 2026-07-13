import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { getImpactDashboardData } from "@/lib/impact/dashboard";

function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "0";

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export default async function ImpactHomePage() {
  const { overview, byLine, alerts, recentActivity, errorMessage } =
    await getImpactDashboardData();

  return (
    <>
      <ImpactPageHeader
        title="Wallet Overview"
        description="Estado general de la wallet interna Level 2: VIUs disponibles, asignadas, FVIUs, residuales y controles."
      >
        <ImpactStatusPill status={overview?.control_status ?? "no data"} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudieron cargar todos los datos.</strong>
          <p className="mt-1">{errorMessage}</p>
          <p className="mt-2 text-xs">
            Si estás en local sin sesión, esto puede pasar hasta que el login
            esté conectado al Impact Registry.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="VIU disponibles"
          value={formatNumber(overview?.spendable_viu_balance)}
          helper={`${formatNumber(
            overview?.spendable_kg_equivalent
          )} kg equivalentes`}
        />

        <ImpactMetricCard
          label="VIU asignadas"
          value={formatNumber(overview?.assigned_viu_balance)}
          helper={`${formatNumber(
            overview?.assigned_kg_equivalent
          )} kg asignados`}
        />

        <ImpactMetricCard
          label="VIU Cards disponibles"
          value={formatNumber(overview?.available_viu_cards_count)}
          helper={`${formatNumber(
            overview?.allocated_viu_cards_count
          )} tarjetas asignadas`}
        />

        <ImpactMetricCard
          label="FVIU Tranches"
          value={formatNumber(overview?.available_fractional_tranches_count)}
          helper={`${formatNumber(
            overview?.residual_kg_balance
          )} kg residuales`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ImpactSection
          title="Balances by impact line"
          description="Resumen de VIUs disponibles/asignadas por línea de impacto."
        >
          {byLine.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3">Spendable</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Residual kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {byLine.map((line) => (
                    <tr key={line.impact_line ?? "unknown"}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {line.impact_line ?? "unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(line.spendable_viu_balance)} VIU
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(line.assigned_viu_balance)} VIU
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(line.residual_kg_balance)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No line data available.</p>
          )}
        </ImpactSection>

        <ImpactSection
          title="Operational alerts"
          description="Alertas derivadas del estado interno de la wallet."
        >
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_code}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {alert.alert_code}
                    </p>
                    <ImpactStatusPill status={alert.severity} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No alerts available.</p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Recent activity"
          description="Últimos movimientos registrados en el ledger de la wallet."
        >
          {recentActivity.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Movement</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Spendable</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Residual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentActivity.map((activity) => (
                    <tr key={activity.permanent_id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">
                          {activity.movement_type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.permanent_id}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{activity.scope_name ?? activity.scope_code}</p>
                        <p className="text-xs text-slate-500">
                          {activity.impact_line}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(activity.spendable_viu_delta)} VIU
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(activity.assigned_viu_delta)} VIU
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(activity.residual_kg_delta)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No recent activity available.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}