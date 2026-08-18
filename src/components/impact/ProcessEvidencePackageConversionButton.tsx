"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

type ConversionProcessResult = {
  result_status: string;

  package_id: string;
  package_permanent_id: string;

  verified_impact_id: string;
  verified_impact_permanent_id: string;

  import_result: string;

  import_movement_id: string;
  import_movement_permanent_id: string;
  import_movement_result: string;

  conversion_batch_id: string;
  conversion_permanent_id: string;
  conversion_result: string;

  methodology: {
    code: string;
    version: string;

    native_mass_per_viu:
      | number
      | string;

    native_mass_unit: string;

    kg_per_viu:
      | number
      | string;

    kg_per_cent_viu:
      | number
      | string;

    methodology_manifest_hash:
      string;
  };

  conversion_movement_id: string;
  conversion_movement_permanent_id: string;

  assets_result: string;

  reported_kg:
    | number
    | string;

  kg_input:
    | number
    | string;

  creditable_kg:
    | number
    | string;

  viu_cents_generated: number;
  full_viu_count: number;
  fractional_viu_cents: number;

  non_creditable_residual_kg:
    | number
    | string;

  viu_assets_in_batch: number;
  fractional_tranches_in_batch: number;

  residual_policy: string;
  residual_reused_for_assets: boolean;

  processed_by:
    | string
    | null;

  processed_at: string;
  message: string;
};

type ProcessEvidencePackageConversionButtonProps = {
  packageId: string;
  permanentId: string;

  methodologyCode: string;
  methodologyVersion: string;

  methodologyMassPerViu:
    | number
    | string;

  methodologyMassUnit: string;

  reportedKg:
    | number
    | string;

  fullViuCount: number;
  fractionalViuCents: number;

  residualKg:
    | number
    | string;
};

function isConversionProcessResult(
  value: unknown
): value is ConversionProcessResult {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const result =
    value as Record<
      string,
      unknown
    >;

  const methodology =
    result.methodology;

  if (
    !methodology ||
    typeof methodology !==
      "object"
  ) {
    return false;
  }

  const methodologyRecord =
    methodology as Record<
      string,
      unknown
    >;

  return (
    typeof result
      .result_status ===
      "string" &&

    typeof result
      .package_id ===
      "string" &&

    typeof result
      .conversion_batch_id ===
      "string" &&

    typeof result
      .conversion_permanent_id ===
      "string" &&

    typeof methodologyRecord
      .code ===
      "string" &&

    typeof methodologyRecord
      .version ===
      "string" &&

    typeof result
      .full_viu_count ===
      "number" &&

    typeof result
      .fractional_viu_cents ===
      "number"
  );
}

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
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0
  );
}

export function ProcessEvidencePackageConversionButton({
  packageId,
  permanentId,
  methodologyCode,
  methodologyVersion,
  methodologyMassPerViu,
  methodologyMassUnit,
  reportedKg,
  fullViuCount,
  fractionalViuCents,
  residualKg,
}: ProcessEvidencePackageConversionButtonProps) {
  const router =
    useRouter();

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string |
    null
  >(null);

  async function handleProcess() {
    if (isProcessing) {
      return;
    }

    const confirmed =
      window.confirm(
        [
          `Process ${permanentId}?`,
          "",
          `Reported impact: ${formatNumber(
            reportedKg
          )} kg`,
          `Methodology: ${methodologyCode} · v${methodologyVersion}`,
          `VIU definition: 1 VIU = ${formatNumber(
            methodologyMassPerViu
          )} ${methodologyMassUnit}`,
          `Full VIUs: ${fullViuCount}`,
          `Fractional cent_VIUs: ${fractionalViuCents}`,
          `Non-creditable residual: ${formatNumber(
            residualKg
          )} kg`,
          "",
          "This operation will import the verified impact, create the wallet movements, create the CONV record and generate the Level 2 VIU assets.",
          "",
          "The operation is atomic and protected against duplicate processing.",
        ].join("\n")
      );

    if (!confirmed) {
      return;
    }

    setIsProcessing(true);
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
        "process_evidence_package_conversion",
        {
          input_package_id:
            packageId,

          input_methodology_code:
            methodologyCode,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (
        !isConversionProcessResult(
          data
        )
      ) {
        throw new Error(
          "The conversion RPC returned an invalid response."
        );
      }

      if (
        data.methodology.code !==
        methodologyCode
      ) {
        throw new Error(
          `The conversion was returned under ${data.methodology.code}, but ${methodologyCode} was selected.`
        );
      }

      window.alert(
        [
          "Conversion completed successfully.",
          "",
          `Package: ${data.package_permanent_id}`,
          `Conversion: ${data.conversion_permanent_id}`,
          `Methodology: ${data.methodology.code} · v${data.methodology.version}`,
          `VIU definition: 1 VIU = ${formatNumber(
            data.methodology
              .native_mass_per_viu
          )} ${data.methodology.native_mass_unit}`,
          `Import movement: ${data.import_movement_permanent_id}`,
          `Conversion movement: ${data.conversion_movement_permanent_id}`,
          "",
          `Full VIUs: ${data.full_viu_count}`,
          `Fractional cent_VIUs: ${data.fractional_viu_cents}`,
          `Residual: ${formatNumber(
            data.non_creditable_residual_kg
          )} kg`,
          "",
          data.message,
        ].join("\n")
      );

      router.push(
        `/impact/conversions/${encodeURIComponent(
          data.conversion_batch_id
        )}`
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The evidence package could not be processed."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        disabled={isProcessing}
        onClick={handleProcess}
        className={[
          "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition",

          isProcessing
            ? "cursor-wait bg-slate-400"
            : "bg-slate-950 hover:bg-slate-700",
        ].join(" ")}
      >
        {isProcessing
          ? "Processing conversion..."
          : "Confirm import and conversion"}
      </button>

      {errorMessage ? (
        <p className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}