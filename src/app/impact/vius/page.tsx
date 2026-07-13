import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import { ViuAssetCard } from "@/components/impact/ViuAssetCard";
import {
  getImpactViuCardsData,
  type ImpactRawRecord,
  type ImpactRawValue,
} from "@/lib/impact/viu-cards";

function valueToString(value: ImpactRawValue, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function pickValue(record: ImpactRawRecord, keys: string[]) {
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

function statusLooksAssigned(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("assigned") ||
    normalized.includes("allocated") ||
    normalized.includes("issued")
  );
}

function statusLooksAvailable(status: string) {
  return status.toLowerCase().includes("available");
}

function statusLooksTokenReady(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("prepared") ||
    normalized.includes("ready") ||
    normalized.includes("future")
  );
}

export default async function ImpactViusPage() {
  const {
    cards,
    availableCards,
    summaryByStatus,
    summaryByLine,
    tokenReadiness,
    errorMessage,
  } = await getImpactViuCardsData();

  const availableCount =
    availableCards.length > 0
      ? availableCards.length
      : cards.filter((card) =>
          statusLooksAvailable(
            valueToString(card.asset_status ?? card.status, "")
          )
        ).length;

  const assignedCount = cards.filter((card) =>
    statusLooksAssigned(valueToString(card.asset_status ?? card.status, ""))
  ).length;

  const tokenReadyCount = cards.filter((card) =>
    statusLooksTokenReady(valueToString(card.tokenization_status, ""))
  ).length;

  return (
    <>
      <ImpactPageHeader
        title="VIU Cards"
        description="Tarjetas VIU completas generadas desde kg verificados. Cada tarjeta tiene ID permanente, estado, manifest/hash y preparación para futuro mint."
      >
        <ImpactStatusPill status={errorMessage ? "warning" : "connected"} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudieron cargar todos los datos de VIU Cards.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Total VIU Cards"
          value={formatNumber(cards.length)}
          helper="Tarjetas completas generadas"
        />

        <ImpactMetricCard
          label="Available"
          value={formatNumber(availableCount)}
          helper="Disponibles para asignación"
        />

        <ImpactMetricCard
          label="Assigned / Issued"
          value={formatNumber(assignedCount)}
          helper="Ya vinculadas a cliente"
        />

        <ImpactMetricCard
          label="Token-ready"
          value={formatNumber(tokenReadyCount)}
          helper="Preparadas para futuro on-chain"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ImpactSection
          title="Summary by status"
          description="Conteo de tarjetas VIU por estado operativo."
        >
          {summaryByStatus.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">VIU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summaryByStatus.map((row, index) => {
                    const status = pickValue(row, [
                      "asset_status",
                      "status",
                      "tokenization_status",
                    ]);

                    const count = pickValue(row, [
                      "cards_count",
                      "asset_count",
                      "assets_count",
                      "count",
                      "total_cards",
                    ]);

                    const viu = pickValue(row, [
                      "total_viu_amount",
                      "total_viu",
                      "viu_amount",
                      "viu_balance",
                    ]);

                    return (
                      <tr key={`${valueToString(status)}-${index}`}>
                        <td className="px-4 py-3">
                          <ImpactStatusPill status={valueToString(status)} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(count)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(viu)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No summary by status available.
            </p>
          )}
        </ImpactSection>

        <ImpactSection
          title="Summary by impact line"
          description="Distribución de tarjetas VIU por línea de impacto."
        >
          {summaryByLine.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Allocated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summaryByLine.map((row, index) => {
                    const impactLine = pickValue(row, ["impact_line"]);
                    const available = pickValue(row, [
                      "available_viu_cards_count",
                      "available_cards_count",
                      "available_count",
                    ]);
                    const allocated = pickValue(row, [
                      "allocated_viu_cards_count",
                      "assigned_viu_cards_count",
                      "allocated_count",
                      "assigned_count",
                    ]);

                    return (
                      <tr key={`${valueToString(impactLine)}-${index}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {valueToString(impactLine, "unknown")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(available)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatNumber(allocated)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No summary by line available.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Token readiness"
          description="Estado de preparación de las tarjetas VIU para futura migración on-chain."
        >
          {tokenReadiness.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tokenReadiness.map((row, index) => {
                const status = pickValue(row, [
                  "tokenization_status",
                  "mint_readiness_status",
                  "readiness_status",
                  "status",
                ]);

                const count = pickValue(row, [
                  "assets_count",
                  "asset_count",
                  "cards_count",
                  "count",
                  "total_assets",
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
                    <p className="text-sm text-slate-500">VIU cards</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No token readiness data available.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="VIU Asset Gallery"
          description="Listado de tarjetas VIU completas con trazabilidad, hash y estado de asignación."
        >
          {cards.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {cards.map((card, index) => (
                <ViuAssetCard
                  key={
                    valueToString(
                      card.permanent_id ??
                        card.viu_asset_permanent_id ??
                        card.asset_permanent_id ??
                        card.id,
                      `viu-card-${index}`
                    )
                  }
                  card={card}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No VIU cards available yet.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}