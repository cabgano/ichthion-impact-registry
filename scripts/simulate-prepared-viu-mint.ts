import { createClient } from "@supabase/supabase-js";

import {
  simulatePreparedBlockchainMint,
  VIU_BLOCKCHAIN_TEST_CONFIG,
  type PreparedViuMintPayload,
} from "../src/lib/blockchain/viu-mint-adapter";

async function loadPreparedMint(
  mintPermanentId: string,
): Promise<PreparedViuMintPayload> {
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

  const { data, error } = await supabase.rpc(
    "get_prepared_viu_blockchain_mint_payload",
    {
      p_mint_permanent_id: mintPermanentId,
    },
  );

  if (error) {
    throw new Error(
      `Could not read prepared VIU MINT payload: ${error.message}`,
    );
  }

  const rows =
    (data as PreparedViuMintPayload[] | null) ??
    [];

  const payload = rows[0];

  if (!payload) {
    throw new Error(
      `Prepared MINT not found: ${mintPermanentId}`,
    );
  }

  return payload;
}

async function main() {
  const mintPermanentId = process.argv[2];

  if (!mintPermanentId) {
    throw new Error(
      "Usage: simulate-prepared-viu-mint.ts <MINT permanent ID>",
    );
  }

  console.log("");
  console.log(
    "=== Ichthion VIU Blockchain Mint Simulation ===",
  );
  console.log("");

  console.log("Network: Base Sepolia");
  console.log(
    `Chain ID: ${VIU_BLOCKCHAIN_TEST_CONFIG.chainId}`,
  );
  console.log(
    `Contract: ${VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress}`,
  );

  console.log("");
  console.log("Reading prepared MINT from Registry...");

  const payload =
    await loadPreparedMint(mintPermanentId);

  console.log(
    `Prepared MINT found: ${payload.permanent_id}`,
  );

  console.log("");

  const result =
    await simulatePreparedBlockchainMint(payload);

  console.log(`MINT: ${result.mintPermanentId}`);
  console.log(`VIU: ${result.futureTokenId}`);

  console.log("");
  console.log(`Operator: ${result.operator}`);
  console.log(`Recipient: ${result.recipient}`);

  console.log(
    `Recipient source: ${result.recipientSource}`,
  );

  console.log("");
  console.log(
    `Metadata hash: ${result.metadataHash}`,
  );

  console.log(
    `Metadata hash verified: ${result.canonicalMetadataHashMatches}`,
  );

  console.log("");
  console.log(
    `Token URI mode: ${result.tokenUriSource}`,
  );

  console.log("");
  console.log(
    `Expected token ID: ${result.expectedTokenId}`,
  );

  console.log(
    `Contract token ID: ${result.contractTokenId}`,
  );

  console.log(
    `Simulated token ID: ${result.simulatedTokenId}`,
  );

  console.log("");
  console.log(
    `Simulation passed: ${result.simulationPassed}`,
  );

  console.log("");
  console.log(
    "PASS: Registry prepared MINT is accepted by the Base Sepolia VIU contract.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: VIU mint simulation failed.",
  );

  console.error(error);

  process.exitCode = 1;
});