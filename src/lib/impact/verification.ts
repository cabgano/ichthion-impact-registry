import { createClient } from "@/lib/supabase/server";

export type VerificationRecord = Record<string, unknown>;

export type VerificationData = {
  record: VerificationRecord | null;
  errorMessage: string | null;
};

export async function getViuAssetVerificationData(
  viuAssetPermanentId: string
): Promise<VerificationData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_viu_asset_verification_page", {
      input_viu_asset_permanent_id: viuAssetPermanentId,
    })
    .maybeSingle();

  return {
    record: (data as VerificationRecord | null) ?? null,
    errorMessage: error?.message ?? null,
  };
}

export async function getClientAllocationVerificationData(
  allocationReference: string
): Promise<VerificationData> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_client_allocation_verification_page", {
      input_allocation_reference: allocationReference,
    })
    .maybeSingle();

  return {
    record: (data as VerificationRecord | null) ?? null,
    errorMessage: error?.message ?? null,
  };
}