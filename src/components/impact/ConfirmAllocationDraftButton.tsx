"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ConfirmAllocationDraftButtonProps = {
  allocationId: string;
  allocationPermanentId: string;
  clientName: string;
  expectedViuCents: number;
  reservedViuCents: number;
};

type ConfirmAllocationResult = {
  allocation_id: string;
  allocation_permanent_id: string;
  client_code: string;
  allocation_status: string;
  confirmed_sources_count: number;
  confirmed_viu_cents: number;
  confirmed_viu_amount:
    | number
    | string
    | null;
  confirmed_kg_equivalent:
    | number
    | string
    | null;
  movement_count: number;
  message: string;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isConfirmResult(
  value: unknown
): value is ConfirmAllocationResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.allocation_id === "string" &&
    typeof value.allocation_permanent_id === "string" &&
    typeof value.client_code === "string" &&
    typeof value.allocation_status === "string" &&
    typeof value.confirmed_sources_count === "number" &&
    typeof value.confirmed_viu_cents === "number" &&
    typeof value.movement_count === "number" &&
    typeof value.message === "string"
  );
}

function extractConfirmResult(
  value: unknown
): ConfirmAllocationResult | null {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  return isConfirmResult(candidate)
    ? candidate
    : null;
}

function formatNumber(
  value:
    | number
    | string
    | null
) {
  const numeric =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(numeric)
      ? numeric
      : 0
  );
}

export function ConfirmAllocationDraftButton({
  allocationId,
  allocationPermanentId,
  clientName,
  expectedViuCents,
  reservedViuCents,
}: ConfirmAllocationDraftButtonProps) {
  const router = useRouter();

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const selectionComplete =
    expectedViuCents > 0 &&
    reservedViuCents ===
      expectedViuCents;

  async function confirmAllocation() {
    if (
      !selectionComplete ||
      isConfirming
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          `Confirm ${allocationPermanentId}?`,
          "",
          `Client: ${clientName}`,
          `VIU: ${formatNumber(
            reservedViuCents / 100
          )}`,
          `kg equivalent: ${formatNumber(
            reservedViuCents * 10
          )}`,
          "",
          "This will permanently allocate the selected VIU cards to the client.",
        ].join("\n")
      );

    if (!confirmed) {
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase.rpc(
        "confirm_client_allocation",
        {
          input_allocation_id:
            allocationId,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      const result =
        extractConfirmResult(
          data
        );

      if (!result) {
        throw new Error(
          "The allocation confirmation RPC returned an invalid response."
        );
      }

      window.alert(
        [
          "Allocation confirmed.",
          "",
          `ALLOC: ${result.allocation_permanent_id}`,
          `Status: ${result.allocation_status}`,
          `Sources: ${result.confirmed_sources_count}`,
          `VIU: ${formatNumber(
            result.confirmed_viu_amount
          )}`,
          `kg: ${formatNumber(
            result.confirmed_kg_equivalent
          )}`,
          `MOV records created: ${result.movement_count}`,
        ].join("\n")
      );

      router.push(
        "/impact/allocations"
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The allocation could not be confirmed."
      );
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="space-y-4">
      {!selectionComplete ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Reserve exactly{" "}
          {formatNumber(
            expectedViuCents / 100
          )}{" "}
          VIU before confirming this allocation.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          The VIU selection matches the allocation target and is ready for confirmation.
        </div>
      )}

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        disabled={
          !selectionComplete ||
          isConfirming
        }
        onClick={
          confirmAllocation
        }
        className={[
          "inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition",

          !selectionComplete ||
          isConfirming
            ? "cursor-not-allowed bg-slate-400"
            : "bg-slate-950 hover:bg-slate-700",
        ].join(" ")}
      >
        {isConfirming
          ? "Confirming allocation..."
          : "Confirm allocation"}
      </button>

      <p className="text-xs text-slate-500">
        Confirmation converts the selected VIU cards from reserved to allocated and creates the corresponding allocation movement records.
      </p>
    </div>
  );
}