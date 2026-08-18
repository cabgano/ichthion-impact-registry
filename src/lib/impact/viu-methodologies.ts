import {
  createClient,
} from "@/lib/supabase/server";

export type SelectableViuMethodology = {
  methodology_code: string;
  version: string;

  mass_per_viu:
    | number
    | string;

  mass_unit: string;

  kg_per_viu:
    | number
    | string;

  kg_per_cent_viu:
    | number
    | string;

  methodology_status: string;
  is_default: boolean;

  residual_policy: string;
  methodology_manifest_hash: string;
};

type SelectableViuMethodologiesResult = {
  methodologies:
    SelectableViuMethodology[];

  errorMessage:
    | string
    | null;
};

function isSelectableViuMethodology(
  value: unknown
): value is SelectableViuMethodology {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const methodology =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof methodology
      .methodology_code ===
      "string" &&

    typeof methodology
      .version ===
      "string" &&

    typeof methodology
      .mass_unit ===
      "string" &&

    typeof methodology
      .methodology_status ===
      "string" &&

    typeof methodology
      .is_default ===
      "boolean"
  );
}

export async function getSelectableViuMethodologies():
Promise<SelectableViuMethodologiesResult> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "list_selectable_viu_methodologies"
  );

  if (error) {
    return {
      methodologies: [],
      errorMessage:
        error.message,
    };
  }

  if (!Array.isArray(data)) {
    return {
      methodologies: [],
      errorMessage:
        "The selectable methodology RPC returned an invalid response.",
    };
  }

  const methodologies =
    data.filter(
      isSelectableViuMethodology
    );

  return {
    methodologies,
    errorMessage: null,
  };
}