import { FractionalTrancheCard } from "@/components/impact/FractionalTrancheCard";
import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import {
  getFractionalPoolData,
  type ImpactRawRecord,
  type ImpactRawValue,
} from "@/lib/impact/fractional-pool";

function valueToString(value: ImpactRawValue, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function pickValue(record: ImpactRawRecord | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined && String(value).length > 0) {
      return value;
    }
  }

  return null;
}

function formatNumber(value: ImpactRawValue) {
  if (value === null || value === undefined) return "0";

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);

  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function sumNumeric(records: ImpactRawRecord[], keys: string[]) {
  return records.reduce((total, record) => {
    const value = pickValue(record, keys);
    const numericValue =
      typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0);

    return total + (Number.isNaN(numericValue) ? 0 : numericValue);
  }, 0);
}

export default async function ImpactFractionsPage() {
  const {
    overview,
    tranches,
    availableTranches,
    byLine,
    residualKg,
    readiness,
    errorMessage,
  } = await getFractionalPoolData();

  const totalAvailableCents =
    Number(
      pickValue(overview, [
        "available_viu_cents",
        "available_viu_cents_balance",
        "total_available_viu_cents",
        "available_fractional_viu_cents",
      ]) ?? 0
    ) ||
    sumNumeric(tranches, ["available_viu_cents", "available_cents"]);

  const totalAllocatedCents =
    Number(
      pickValue(overview, [
        "allocated_viu_cents",
        "allocated_viu_cents_balance",
        "total_allocated_viu_cents",
        "allocated_fractional_viu_cents",
      ]) ?? 0
    ) ||
    sumNumeric(tranches, ["allocated_viu_cents", "allocated_cents"]);

  const totalResidualKg = pickValue(residualKg, [
    "residual_kg_balance",
    "total_residual_kg",
    "residual_kg",
    "kg_residual",
  ]);

  const availableViu = totalAvailableCents / 100;
  const allocatedViu = totalAllocatedCents / 100;

  return (
    <>
      <ImpactPageHeader
        title="Fractional Pool"
        description="Pool interno de FVIUs, cent_VIUs y kg residuales. Aquí se controlan fracciones menores a una VIU completa."
      >
        <ImpactStatusPill status={errorMessage ? "warning" : "connected"} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudieron cargar todos los datos del Fractional Pool.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="FVIU Tranches"
          value={formatNumber(tranches.length)}
          helper="Tranches fraccionarias generadas"
        />

        <ImpactMetricCard
          label="Available FVIU"
          value={formatNumber(availableViu)}
          helper={`${formatNumber(totalAvailableCents)} cent_VIUs disponibles`}
        />

        <ImpactMetricCard
          label="Allocated FVIU"
          value={formatNumber(allocatedViu)}
          helper={`${formatNumber(totalAllocatedCents)} cent_VIUs asignados`}
        />

        <ImpactMetricCard
          label="Residual kg"
          value={formatNumber(totalResidualKg)}
          helper="kg aún no convertibles a cent_VIU"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ImpactSection
          title="Fractional pool by impact line"
          description="Distribución de FVIUs disponibles/asignadas por línea de impacto."
        >
          {byLine.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Allocated</th>
                    <th className="px-4 py-3">Residual kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {byLine.map((row, index) => {
                    const impactLine = pickValue(row, ["impact_line"]);

                    const available = pickValue(row, [
                      "available_viu_amount",
                      "available_fractional_viu_balance",
                      "available_viu_balance",
                      "available_fviu",
                    ]);

                    const allocated = pickValue(row, [
                      "allocated_viu_amount",
                      "allocated_fractional_viu_balance",
                      "allocated_viu_balance",
                      "allocated_fviu",
                    ]);

                    const residual = pickValue(row, [
                      "residual_kg_balance",
                      "total_residual_kg",
                      "residual_kg",
                    ]);

                    return (
                      <tr key={`${valueToString(impactLine)}-${index}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {valueToString(impactLine, "unknown")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(available)} VIU
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(allocated)} VIU
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(residual)} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No fractional pool by line data available.
            </p>
          )}
        </ImpactSection>

        <ImpactSection
          title="Readiness"
          description="Estado de preparación/verificación de los tranches fraccionarios."
        >
          {readiness.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {readiness.map((row, index) => {
                const status = pickValue(row, [
                  "readiness_status",
                  "tranche_readiness_status",
                  "tranche_status",
                  "status",
                ]);

                const count = pickValue(row, [
                  "tranches_count",
                  "tranche_count",
                  "count",
                  "total_tranches",
                ]);

                return (
                  <div
                    key={`${valueToString(status)}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <ImpactStatusPill status={valueToString(status)} />
                    <p className="mt-3 text-2xl font-bold text-slate-950">
                      {formatNumber(count)}
                    </p>
                    <p className="text-sm text-slate-500">FVIU tranches</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No readiness data available.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Available Fractional Tranches"
          description="Fracciones disponibles para futuras asignaciones o recomposición."
        >
          {availableTranches.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {availableTranches.map((tranche, index) => (
                <FractionalTrancheCard
                  key={valueToString(
                    tranche.permanent_id ??
                      tranche.tranche_permanent_id ??
                      tranche.fractional_tranche_permanent_id ??
                      tranche.id,
                    `available-tranche-${index}`
                  )}
                  tranche={tranche}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No available fractional tranches.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="All Fractional Tranches"
          description="Galería completa de FVIUs generadas desde conversiones kg → VIU."
        >
          {tranches.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {tranches.map((tranche, index) => (
                <FractionalTrancheCard
                  key={valueToString(
                    tranche.permanent_id ??
                      tranche.tranche_permanent_id ??
                      tranche.fractional_tranche_permanent_id ??
                      tranche.id,
                    `tranche-${index}`
                  )}
                  tranche={tranche}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No fractional tranches available yet.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}