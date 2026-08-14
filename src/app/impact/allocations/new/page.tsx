import Link from "next/link";

import {
  CreateAllocationDraftForm,
} from "@/components/impact/CreateAllocationDraftForm";

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
  getActiveImpactClientsData,
} from "@/lib/impact/allocations";

export const dynamic =
  "force-dynamic";

function currentPeriodKey() {
  return new Date()
    .toISOString()
    .slice(0, 7)
    .replace("-", "");
}

export default async function NewAllocationDraftPage() {
  const {
    clients,
    errorMessage,
  } =
    await getActiveImpactClientsData();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/impact/allocations"
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to client allocations
        </Link>
      </div>

      <ImpactPageHeader
        title="Create Allocation Draft"
        description="Crea un borrador para seleccionar posteriormente las tarjetas VIU exactas que serán asignadas al cliente."
      >
        <ImpactStatusPill
          status={
            errorMessage
              ? "warning"
              : "draft"
          }
        />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      {clients.length > 0 ? (
        <ImpactSection
          title="Draft configuration"
          description="En este paso se define el cliente y la cantidad esperada. Ninguna VIU será reservada todavía."
        >
          <CreateAllocationDraftForm
            clients={clients}
            defaultPeriodKey={
              currentPeriodKey()
            }
          />
        </ImpactSection>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          No active impact clients are available. An active client is required before creating an allocation draft.
        </div>
      )}
    </>
  );
}