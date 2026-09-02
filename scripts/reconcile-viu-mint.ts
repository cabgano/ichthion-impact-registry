import { createClient } from "@supabase/supabase-js";

import {
  createPublicClient,
  http,
  type Address,
} from "viem";

import { baseSepolia } from "viem/chains";

const CONTRACT =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const ABI = [
  {
    type: "function",
    name: "computeTokenId",
    stateMutability: "pure",
    inputs: [
      { name: "viuId", type: "string" },
    ],
    outputs: [
      { name: "", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "", type: "address" },
    ],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "", type: "string" },
    ],
  },
  {
    type: "function",
    name: "metadataHashOf",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "", type: "bytes32" },
    ],
  },
] as const;

type ReconciliationRow = {
  mint_permanent_id: string;
  future_token_id: string;

  mint_readiness_status: string;
  onchain_status: string;

  onchain_metadata_hash: string;

  chain_id: string | null;
  contract_address: string | null;
  token_id: string | null;
  token_uri: string | null;
  token_tx_hash: string | null;
  wallet_address: string | null;

  viu_asset_permanent_id: string;
  tokenization_status: string;

  asset_chain_id: number | null;
  asset_contract_address: string | null;
  asset_token_id: string | null;
  asset_token_uri: string | null;
  asset_token_tx_hash: string | null;
  asset_wallet_address: string | null;
};

async function main() {
  const mintPermanentId = process.argv[2];

  if (!mintPermanentId) {
    throw new Error(
      "Usage: reconcile-viu-mint.ts <MINT permanent ID>",
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server configuration is incomplete.",
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

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  console.log("");
  console.log(
    "=== Ichthion VIU Registry ↔ Blockchain Reconciliation ===",
  );
  console.log("");

  // ==========================================================
  // 1. READ REGISTRY THROUGH BACKEND-ONLY RPC
  // ==========================================================

  const { data, error } = await supabase.rpc(
    "get_viu_blockchain_reconciliation_payload",
    {
      p_mint_permanent_id: mintPermanentId,
    },
  );

  if (error) {
    throw new Error(
      `Could not read Registry reconciliation payload: ${error.message}`,
    );
  }

  const rows =
    (data as ReconciliationRow[] | null) ?? [];

  const mint = rows[0];

  if (!mint) {
    throw new Error(
      `Registry MINT not found: ${mintPermanentId}`,
    );
  }

  console.log(
    `MINT: ${mint.mint_permanent_id}`,
  );

  console.log(
    `VIU: ${mint.future_token_id}`,
  );

  // ==========================================================
  // 2. CALCULATE CANONICAL TOKEN ID FROM CONTRACT
  // ==========================================================

  const tokenId =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "computeTokenId",
      args: [mint.future_token_id],
    });

  // ==========================================================
  // 3. READ CURRENT BLOCKCHAIN STATE
  // ==========================================================

  const owner =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });

  const tokenUri =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "tokenURI",
      args: [tokenId],
    });

  const metadataHash =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "metadataHashOf",
      args: [tokenId],
    });

  // ==========================================================
  // 4. DISPLAY REGISTRY STATE
  // ==========================================================

  console.log("");
  console.log("Registry MINT:");

  console.log(
    `  mint_readiness_status = ${mint.mint_readiness_status}`,
  );

  console.log(
    `  onchain_status = ${mint.onchain_status}`,
  );

  console.log(
    `  chain_id = ${mint.chain_id}`,
  );

  console.log(
    `  contract_address = ${mint.contract_address}`,
  );

  console.log(
    `  token_id = ${mint.token_id}`,
  );

  console.log(
    `  token_uri = ${mint.token_uri}`,
  );

  console.log(
    `  tx_hash = ${mint.token_tx_hash}`,
  );

  console.log(
    `  wallet = ${mint.wallet_address}`,
  );

  console.log("");
  console.log("Registry VIU Asset:");

  console.log(
    `  VIU = ${mint.viu_asset_permanent_id}`,
  );

  console.log(
    `  tokenization_status = ${mint.tokenization_status}`,
  );

  console.log(
    `  chain_id = ${mint.asset_chain_id}`,
  );

  console.log(
    `  contract_address = ${mint.asset_contract_address}`,
  );

  console.log(
    `  token_id = ${mint.asset_token_id}`,
  );

  console.log(
    `  token_uri = ${mint.asset_token_uri}`,
  );

  console.log(
    `  tx_hash = ${mint.asset_token_tx_hash}`,
  );

  console.log(
    `  wallet = ${mint.asset_wallet_address}`,
  );

  // ==========================================================
  // 5. DISPLAY BLOCKCHAIN STATE
  // ==========================================================

  console.log("");
  console.log("Blockchain:");

  console.log(
    "  chain_id = 84532",
  );

  console.log(
    `  contract_address = ${CONTRACT}`,
  );

  console.log(
    `  token_id = ${tokenId}`,
  );

  console.log(
    `  owner = ${owner}`,
  );

  console.log(
    `  token_uri = ${tokenUri}`,
  );

  console.log(
    `  metadata_hash = ${metadataHash}`,
  );

  // ==========================================================
  // 6. REGISTRY MINT ↔ BLOCKCHAIN CHECKS
  // ==========================================================

  const mintChecks = {
    status:
      mint.mint_readiness_status ===
        "minted_on_chain" &&
      mint.onchain_status === "minted",

    chain:
      mint.chain_id === "84532",

    contract:
      mint.contract_address?.toLowerCase() ===
      CONTRACT.toLowerCase(),

    tokenId:
      mint.token_id ===
      tokenId.toString(),

    tokenUri:
      mint.token_uri ===
      tokenUri,

    metadataHash:
      `0x${mint.onchain_metadata_hash}`
        .toLowerCase() ===
      metadataHash.toLowerCase(),

    wallet:
      mint.wallet_address?.toLowerCase() ===
      owner.toLowerCase(),
  };

  // ==========================================================
  // 7. VIU ASSET ↔ BLOCKCHAIN CHECKS
  // ==========================================================

  const assetChecks = {
    tokenizationStatus:
      mint.tokenization_status ===
      "tokenized",

    chain:
      mint.asset_chain_id === 84532,

    contract:
      mint.asset_contract_address
        ?.toLowerCase() ===
      CONTRACT.toLowerCase(),

    tokenId:
      mint.asset_token_id ===
      tokenId.toString(),

    tokenUri:
      mint.asset_token_uri ===
      tokenUri,

    wallet:
      mint.asset_wallet_address
        ?.toLowerCase() ===
      owner.toLowerCase(),

    txHash:
      mint.asset_token_tx_hash ===
      mint.token_tx_hash,
  };

  // ==========================================================
  // 8. MINT ↔ VIU ASSET INTERNAL CONSISTENCY
  // ==========================================================

  const internalChecks = {
    chain:
      mint.chain_id ===
      String(mint.asset_chain_id),

    contract:
      mint.contract_address
        ?.toLowerCase() ===
      mint.asset_contract_address
        ?.toLowerCase(),

    tokenId:
      mint.token_id ===
      mint.asset_token_id,

    tokenUri:
      mint.token_uri ===
      mint.asset_token_uri,

    txHash:
      mint.token_tx_hash ===
      mint.asset_token_tx_hash,

    wallet:
      mint.wallet_address
        ?.toLowerCase() ===
      mint.asset_wallet_address
        ?.toLowerCase(),
  };

  // ==========================================================
  // 9. PRINT CHECK RESULTS
  // ==========================================================

  console.log("");
  console.log(
    "Registry MINT ↔ Blockchain checks:",
  );

  for (
    const [name, passed]
    of Object.entries(mintChecks)
  ) {
    console.log(
      `  ${name}: ${
        passed ? "PASS" : "FAIL"
      }`,
    );
  }

  console.log("");
  console.log(
    "VIU Asset ↔ Blockchain checks:",
  );

  for (
    const [name, passed]
    of Object.entries(assetChecks)
  ) {
    console.log(
      `  ${name}: ${
        passed ? "PASS" : "FAIL"
      }`,
    );
  }

  console.log("");
  console.log(
    "Registry MINT ↔ VIU Asset checks:",
  );

  for (
    const [name, passed]
    of Object.entries(internalChecks)
  ) {
    console.log(
      `  ${name}: ${
        passed ? "PASS" : "FAIL"
      }`,
    );
  }

  // ==========================================================
  // 10. FINAL RECONCILIATION RESULT
  // ==========================================================

  const reconciliationPassed =
    [
      ...Object.values(mintChecks),
      ...Object.values(assetChecks),
      ...Object.values(internalChecks),
    ].every(Boolean);

  console.log("");

  if (!reconciliationPassed) {
    throw new Error(
      "Registry ↔ blockchain reconciliation failed.",
    );
  }

  console.log(
    "PASS: Registry MINT, VIU Digital Asset and blockchain contain the same canonical VIU identity.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: VIU reconciliation failed.",
  );

  console.error(error);

  process.exitCode = 1;
});