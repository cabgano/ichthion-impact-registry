import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

type PreparedMintPayload = {
  permanent_id: string;
  future_token_id: string;
  onchain_metadata_hash: string;
  canonical_metadata_text: string;
};

async function main() {
  const mintPermanentId = process.argv[2];

  if (!mintPermanentId) {
    throw new Error(
      "Usage: publish-viu-onchain-metadata.ts <MINT permanent ID>",
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  console.log("");
  console.log(
    "=== Ichthion VIU On-Chain Metadata Publication ===",
  );
  console.log("");

  console.log(
    `Reading prepared MINT: ${mintPermanentId}`,
  );

  const { data, error } = await supabase.rpc(
    "get_prepared_viu_blockchain_mint_payload",
    {
      p_mint_permanent_id: mintPermanentId,
    },
  );

  if (error) {
    throw new Error(
      `Could not read prepared MINT: ${error.message}`,
    );
  }

  const rows =
    (data as PreparedMintPayload[] | null) ?? [];

  const payload = rows[0];

  if (!payload) {
    throw new Error(
      `Prepared MINT not found: ${mintPermanentId}`,
    );
  }

  const canonicalBytes = Buffer.from(
    payload.canonical_metadata_text,
    "utf8",
  );

  const calculatedHash = createHash("sha256")
    .update(canonicalBytes)
    .digest("hex");

  if (
    calculatedHash.toLowerCase() !==
    payload.onchain_metadata_hash.toLowerCase()
  ) {
    throw new Error(
      "Canonical metadata hash verification failed before upload.",
    );
  }

  console.log(
    `VIU: ${payload.future_token_id}`,
  );

  console.log(
    `Metadata bytes: ${canonicalBytes.length}`,
  );

  console.log(
    `Metadata hash: ${payload.onchain_metadata_hash}`,
  );

  console.log(
    "Pre-upload hash verification: PASS",
  );

  const objectPath =
    `sha256/${payload.onchain_metadata_hash}.json`;

  const { error: uploadError } =
    await supabase.storage
      .from("viu-onchain-metadata")
      .upload(
        objectPath,
        canonicalBytes,
        {
          contentType: "application/json; charset=utf-8",
          cacheControl: "31536000",
          upsert: false,
        },
      );

  if (uploadError) {
    throw new Error(
      `Could not publish metadata: ${uploadError.message}`,
    );
  }

  const { data: publicUrlData } =
    supabase.storage
      .from("viu-onchain-metadata")
      .getPublicUrl(objectPath);

  console.log("");
  console.log(
    `Object path: ${objectPath}`,
  );

  console.log(
    `Token URI: ${publicUrlData.publicUrl}`,
  );

  console.log("");
  console.log(
    "PASS: Canonical VIU metadata published successfully.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: VIU metadata publication failed.",
  );
  console.error(error);

  process.exitCode = 1;
});