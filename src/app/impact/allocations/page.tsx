import { AllocationCard } from "@/components/impact/AllocationCard";
import { ImpactMetricCard } from "@/components/impact/ImpactMetricCard";
import { ImpactPageHeader } from "@/components/impact/ImpactPageHeader";
import { ImpactSection } from "@/components/impact/ImpactSection";
import { ImpactStatusPill } from "@/components/impact/ImpactStatusPill";
import {
  getImpactAllocationsData,
  type AllocationWithDetails,
  type ImpactRawRecord,
  type ImpactRawValue,
} from "@/lib/impact/allocations";

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

function valueToString(value: ImpactRawValue, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  return String(value);
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

function allocationStatus(item: AllocationWithDetails) {
  return valueToString(
    pickValue(item.allocation, ["allocation_status", "status"]),
    "unknown"
  );
}

function allocationHash(item: AllocationWithDetails) {
  return valueToString(
    pickValue(item.allocation, ["allocation_manifest_hash", "manifest_hash"]),
    ""
  );
}

function allocationCents(item: AllocationWithDetails) {
  const direct = pickValue(item.allocation, [
    "total_viu_cents",
    "viu_cents",
    "allocated_viu_cents",
    "total_allocated_viu_cents",
  ]);

  if (direct !== null && direct !== undefined) {
    const parsed =
      typeof direct === "string" ? Number.parseFloat(direct) : Number(direct);

    if (!Number.isNaN(parsed)) return parsed;
  }

  return item.sources.reduce((total, source) => {
    const value = pickValue(source, ["viu_cents", "assigned_viu_cents"]);
    const parsed =
      typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0);

    return total + (Number.isNaN(parsed) ? 0 : parsed);
  }, 0);
}

function clientLabel(item: AllocationWithDetails) {
  return valueToString(
    pickValue(item.client, ["client_name", "name", "client_code", "code"]) ??
      pickValue(item.allocation, ["client_name", "client_code"]),
    "Unknown client"
  );
}

export default async function ImpactAllocationsPage() {
  const { allocations, errorMessage } = await getImpactAllocationsData();

  const issuedCount = allocations.filter((item) =>
    allocationStatus(item).toLowerCase().includes("issued")
  ).length;

  const confirmedCount = allocations.filter((item) =>
    allocationStatus(item).toLowerCase().includes("confirmed")
  ).length;

  const totalCents = allocations.reduce(
    (total, item) => total + allocationCents(item),
    0
  );

  const hashedCount = allocations.filter(
    (item) => allocationHash(item).length > 0
  ).length;

  const clientTotals = allocations.reduce<Record<string, number>>(
    (totals, item) => {
      const client = clientLabel(item);
      totals[client] = (totals[client] ?? 0) + allocationCents(item);
      return totals;
    },
    {}
  );

  return (
    <>
      <ImpactPageHeader
        title="Client Allocations"
        description="Asignaciones emitidas a clientes con sus fuentes, VIUs, kg equivalentes y hash verificable."
      >
        <ImpactStatusPill status={errorMessage ? "warning" : "connected"} />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>No se pudieron cargar todos los datos de asignaciones.</strong>
          <p className="mt-1">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ImpactMetricCard
          label="Total allocations"
          value={formatNumber(allocations.length)}
          helper="Asignaciones registradas"
        />

        <ImpactMetricCard
          label="Issued"
          value={formatNumber(issuedCount)}
          helper={`${formatNumber(confirmedCount)} confirmed`}
        />

        <ImpactMetricCard
          label="Total assigned VIU"
          value={formatNumber(totalCents / 100)}
          helper={`${formatNumber(totalCents * 10)} kg equivalentes`}
        />

        <ImpactMetricCard
          label="Hashed allocations"
          value={formatNumber(hashedCount)}
          helper="Con allocation_manifest_hash"
        />
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Assignments by client"
          description="Resumen del impacto asignado por cliente."
        >
          {Object.entries(clientTotals).length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">VIU</th>
                    <th className="px-4 py-3">kg equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(clientTotals).map(([client, cents]) => (
                    <tr key={client}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {client}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(cents / 100)} VIU
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatNumber(cents * 10)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No client allocation totals available.
            </p>
          )}
        </ImpactSection>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="Allocation Gallery"
          description="Listado de asignaciones con sus fuentes trazables."
        >
          {allocations.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {allocations.map((item, index) => {
                const reference = valueToString(
                  pickValue(item.allocation, [
                    "allocation_reference",
                    "reference",
                    "permanent_id",
                    "id",
                  ]),
                  `allocation-${index}`
                );

                return <AllocationCard key={reference} item={item} />;
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No allocations available yet.
            </p>
          )}
        </ImpactSection>
      </div>
    </>
  );
}