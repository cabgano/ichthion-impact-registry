"use client";

import {
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  SelectableViuMethodology,
} from "@/lib/impact/viu-methodologies";

type ConversionMethodologySelectorProps = {
  packageId: string;

  methodologies:
    SelectableViuMethodology[];

  selectedCode: string;
};

function formatNumber(
  value:
    | number
    | string
) {
  const numericValue =
    Number(value);

  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 8,
    }
  ).format(
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0
  );
}

export function ConversionMethodologySelector({
  packageId,
  methodologies,
  selectedCode,
}: ConversionMethodologySelectorProps) {
  const router =
    useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const selectedMethodology =
    methodologies.find(
      (methodology) =>
        methodology
          .methodology_code ===
        selectedCode
    ) ?? null;

  function handleChange(
    methodologyCode: string
  ) {
    startTransition(() => {
      router.replace(
        `/impact/evidence/${encodeURIComponent(
          packageId
        )}/conversion-preview?methodology=${encodeURIComponent(
          methodologyCode
        )}`
      );
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <label
            htmlFor="viu-methodology"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            VIU Methodology
          </label>

          <select
            id="viu-methodology"
            value={selectedCode}
            disabled={isPending}
            onChange={(
              event
            ) =>
              handleChange(
                event.target.value
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 disabled:cursor-wait disabled:bg-slate-100"
          >
            {methodologies.map(
              (
                methodology
              ) => (
                <option
                  key={
                    methodology
                      .methodology_code
                  }
                  value={
                    methodology
                      .methodology_code
                  }
                >
                  {
                    methodology
                      .methodology_code
                  }
                  {" · "}
                  1 VIU ={" "}
                  {formatNumber(
                    methodology
                      .mass_per_viu
                  )}{" "}
                  {
                    methodology
                      .mass_unit
                  }
                  {methodology
                    .is_default
                    ? " · Default"
                    : ""}
                </option>
              )
            )}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            Select the methodology that will define how the verified impact is converted into VIUs.
          </p>
        </div>

        {selectedMethodology ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected methodology
            </p>

            <p className="mt-2 text-sm font-bold text-slate-950">
              {
                selectedMethodology
                  .methodology_code
              }
              {" · v"}
              {
                selectedMethodology
                  .version
              }
            </p>

            <p className="mt-1 text-sm text-slate-700">
              1 VIU ={" "}
              {formatNumber(
                selectedMethodology
                  .mass_per_viu
              )}{" "}
              {
                selectedMethodology
                  .mass_unit
              }
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Normalized physical equivalent:{" "}
              {formatNumber(
                selectedMethodology
                  .kg_per_viu
              )}{" "}
              kg / VIU
            </p>

            {selectedMethodology
              .is_default ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Current default methodology
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}