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

type ApproveEvidencePackageButtonProps = {
  packageId: string;
  permanentId: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function ApproveEvidencePackageButton({
  packageId,
  permanentId,
  disabled = false,
  disabledReason,
}: ApproveEvidencePackageButtonProps) {
  const router =
    useRouter();

  const [
    isApproving,
    setIsApproving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  async function handleApproval() {
    if (
      disabled ||
      isApproving
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Approve ${permanentId} for conversion?\n\n` +
          "Confirm that the evidence has been reviewed and the required external verification has been received.\n\n" +
          "This action will not create VIUs yet."
      );

    if (!confirmed) {
      return;
    }

    setIsApproving(true);
    setErrorMessage(null);

    try {
      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase.rpc(
        "approve_evidence_package_for_conversion",
        {
          input_package_id:
            packageId,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (
        !data ||
        typeof data !==
          "object"
      ) {
        throw new Error(
          "The approval RPC returned an invalid response."
        );
      }

      const result =
        data as Record<
          string,
          unknown
        >;

      if (
        result.verification_status !==
        "verified"
      ) {
        throw new Error(
          "The database did not confirm the approval."
        );
      }

      router.push(
        `/impact/evidence/${packageId}/conversion-preview`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The package could not be approved."
      );
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={
          handleApproval
        }
        disabled={
          disabled ||
          isApproving
        }
        className={[
          "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto",

          disabled ||
          isApproving
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-emerald-700 text-white hover:bg-emerald-600",
        ].join(" ")}
      >
        {isApproving
          ? "Approving..."
          : "Approve for conversion"}
      </button>

      {disabled &&
      disabledReason ? (
        <p className="mt-2 max-w-xs text-xs text-amber-700">
          {disabledReason}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-2 max-w-sm text-xs text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}