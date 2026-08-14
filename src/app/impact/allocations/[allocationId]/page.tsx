import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ConfirmAllocationDraftButton,
} from "@/components/impact/ConfirmAllocationDraftButton";

import {
  AllocationDraftAssetManager,
} from "@/components/impact/AllocationDraftAssetManager";

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
  getAllocationDraftWorkspaceData,
} from "@/lib/impact/allocations";

type AllocationDraftPageProps = {
  params: Promise<{
    allocationId: string;
  }>;
};

function stringValue(
  value: unknown,
  fallback = "—"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}

function numberValue(
  value: unknown
) {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export default async function AllocationDraftPage({
  params,
}: AllocationDraftPageProps) {
  const {
    allocationId,
  } = await params;

  const {
    allocation,
    reservedSources,
    availableAssets,
    errorMessage,
  } =
    await getAllocationDraftWorkspaceData(
      allocationId
    );

  if (
    !allocation &&
    !errorMessage
  ) {
    notFound();
  }

  const permanentId =
    stringValue(
      allocation?.permanent_id
    );

  const reference =
    stringValue(
      allocation?.allocation_reference
    );

  const clientName =
    stringValue(
      allocation?.client_display_name ??
        allocation?.client_code
    );

  const status =
    stringValue(
      allocation?.allocation_status,
      "unknown"
    );

  const expectedCents =
    numberValue(
      allocation?.expected_viu_cents
    );

  const expectedViu =
    expectedCents / 100;

  const expectedKg =
    numberValue(
      allocation?.expected_kg_equivalent
    );

  const reservedCents =
    reservedSources.reduce(
      (total, source) =>
        total +
        source.viuCents,
      0
    );

  const reservedViu =
    reservedCents / 100;

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
        title={permanentId}
        description={`Allocation draft workspace · ${reference}`}
      >
        <ImpactStatusPill
          status={status}
        />
      </ImpactPageHeader>

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Client
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {clientName}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Expected
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {expectedViu} VIU
          </p>

          <p className="text-xs text-slate-500">
            {expectedKg} kg
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Reserved
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {reservedViu} / {expectedViu} VIU
          </p>

          <p className="text-xs text-slate-500">
            {reservedCents} cent_VIU
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Available inventory
          </p>

          <p className="mt-1 font-bold text-slate-950">
            {availableAssets.length} VIU
          </p>

          <p className="text-xs text-slate-500">
            Full VIU cards
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ImpactSection
          title="VIU Selection"
          description="Reserve or release exact verified VIU cards for this allocation draft."
        >
          <AllocationDraftAssetManager
            allocationId={allocationId}
            expectedViuCents={expectedCents}
            reservedSources={reservedSources}
            availableAssets={availableAssets}
          />
        </ImpactSection>
      </div>

      {status.toLowerCase() === "draft" ? (
        <div className="mt-6">
          <ImpactSection
            title="Review and Confirm"
            description="Review the reserved VIU total before permanently assigning these exact assets to the client."
          >
            <ConfirmAllocationDraftButton
              allocationId={allocationId}
              allocationPermanentId={permanentId}
              clientName={clientName}
              expectedViuCents={expectedCents}
              reservedViuCents={reservedCents}
            />
          </ImpactSection>
        </div>
      ) : null}

    </>
  );
}