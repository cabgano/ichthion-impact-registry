"use client";

import {
  type FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  AllocationDraftClient,
} from "@/lib/impact/allocations";

import {
  createClient,
} from "@/lib/supabase/client";

type CreateAllocationDraftFormProps = {
  clients: AllocationDraftClient[];
  defaultPeriodKey: string;
};

type CreateAllocationDraftResult = {
  allocation_id: string;
  permanent_id: string;
  allocation_reference:
    | string
    | null;
  client_code: string;
  client_display_name: string;
  allocation_status: string;
  expected_viu_cents: number;
  expected_viu_amount:
    | number
    | string
    | null;
  expected_kg_equivalent:
    | number
    | string
    | null;
  message: string;
};

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isCreateAllocationDraftResult(
  value: unknown
): value is CreateAllocationDraftResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.allocation_id ===
      "string" &&
    typeof value.permanent_id ===
      "string" &&
    typeof value.client_code ===
      "string" &&
    typeof value.client_display_name ===
      "string" &&
    typeof value.allocation_status ===
      "string" &&
    typeof value.expected_viu_cents ===
      "number" &&
    typeof value.message ===
      "string"
  );
}

function extractDraftResult(
  value: unknown
): CreateAllocationDraftResult | null {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  return isCreateAllocationDraftResult(
    candidate
  )
    ? candidate
    : null;
}

function formatNumber(
  value:
    | number
    | string
    | null
) {
  const numericValue =
    Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}

export function CreateAllocationDraftForm({
  clients,
  defaultPeriodKey,
}: CreateAllocationDraftFormProps) {
  const router =
    useRouter();

  const [
    clientCode,
    setClientCode,
  ] = useState(
    clients[0]?.clientCode ??
      ""
  );

  const [
    periodKey,
    setPeriodKey,
  ] = useState(
    defaultPeriodKey
  );

  const [
    fullViuCount,
    setFullViuCount,
  ] = useState("1");

  const [
    allocationReference,
    setAllocationReference,
  ] = useState("");

  const [
    allocationPurpose,
    setAllocationPurpose,
  ] = useState("");

  const [
    internalNotes,
    setInternalNotes,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string |
    null
  >(null);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedViuCount =
      Number(fullViuCount);

    if (
      !Number.isInteger(
        parsedViuCount
      ) ||
      parsedViuCount <= 0
    ) {
      setErrorMessage(
        "Full VIU count must be a positive whole number."
      );

      return;
    }

    if (
      !/^[0-9]{6}$/.test(
        periodKey
      )
    ) {
      setErrorMessage(
        "Period must use YYYYMM format."
      );

      return;
    }

    if (!clientCode) {
      setErrorMessage(
        "Select an impact client."
      );

      return;
    }

    const expectedViuCents =
      parsedViuCount * 100;

    const generatedReference =
      allocationReference
        .trim() ||
      [
        clientCode.toUpperCase(),
        periodKey,
        "ALLOC",
        Date.now(),
      ].join("-");

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase =
        await Promise.resolve(
          createClient()
        );

      const {
        data,
        error,
      } = await supabase.rpc(
        "create_client_allocation_draft",
        {
          input_client_code:
            clientCode,

          input_period_key:
            periodKey,

          input_expected_viu_cents:
            expectedViuCents,

          input_allocation_purpose:
            allocationPurpose
              .trim() ||
            null,

          input_allocation_reference:
            generatedReference,

          input_internal_notes:
            internalNotes
              .trim() ||
            null,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      const result =
        extractDraftResult(
          data
        );

      if (!result) {
        throw new Error(
          "The allocation draft RPC returned an invalid response."
        );
      }

      window.alert(
        [
          "Allocation draft created.",
          "",
          `ALLOC: ${result.permanent_id}`,
          `Reference: ${
            result.allocation_reference ??
            generatedReference
          }`,
          `Client: ${result.client_display_name}`,
          `Expected VIUs: ${formatNumber(
            result.expected_viu_cents /
              100
          )}`,
          `Expected kg: ${formatNumber(
            result.expected_kg_equivalent
          )}`,
          `Status: ${result.allocation_status}`,
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
          : "The allocation draft could not be created."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Impact client
          </span>

          <select
            value={clientCode}
            required
            onChange={(event) => {
              setClientCode(
                event.target.value
              );
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950"
          >
            {clients.map(
              (client) => (
                <option
                  key={client.id}
                  value={
                    client.clientCode
                  }
                >
                  {
                    client.displayName
                  }
                  {" · "}
                  {
                    client.clientCode
                  }
                </option>
              )
            )}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Period
          </span>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={periodKey}
            onChange={(event) => {
              setPeriodKey(
                event.target.value
              );
            }}
            placeholder="202608"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
          />

          <span className="mt-1 block text-xs text-slate-500">
            Use YYYYMM format.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Full VIU count
          </span>

          <input
            type="number"
            min="1"
            step="1"
            required
            value={fullViuCount}
            onChange={(event) => {
              setFullViuCount(
                event.target.value
              );
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
          />

          <span className="mt-1 block text-xs text-slate-500">
            Each full VIU represents 1,000 kg.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Allocation reference
          </span>

          <input
            type="text"
            value={
              allocationReference
            }
            onChange={(event) => {
              setAllocationReference(
                event.target.value
              );
            }}
            placeholder="NW-202608-IMPACT-001"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
          />

          <span className="mt-1 block text-xs text-slate-500">
            A unique reference will be generated automatically when left blank.
          </span>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-900">
          Allocation purpose
        </span>

        <input
          type="text"
          value={allocationPurpose}
          onChange={(event) => {
            setAllocationPurpose(
              event.target.value
            );
          }}
          placeholder="Monthly verified impact allocation"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-900">
          Internal notes
        </span>

        <textarea
          value={internalNotes}
          onChange={(event) => {
            setInternalNotes(
              event.target.value
            );
          }}
          rows={4}
          placeholder="Internal information for the Impact Administrator."
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-950"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          The draft will not assign or reserve any VIU yet.
        </p>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            clients.length === 0
          }
          className={[
            "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition",
            isSubmitting ||
            clients.length === 0
              ? "cursor-not-allowed bg-slate-400"
              : "bg-slate-950 hover:bg-slate-700",
          ].join(" ")}
        >
          {isSubmitting
            ? "Creating draft..."
            : "Create allocation draft"}
        </button>
      </div>
    </form>
  );
}