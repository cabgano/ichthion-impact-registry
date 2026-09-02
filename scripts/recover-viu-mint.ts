import { createClient } from "@supabase/supabase-js";

import {
  createPublicClient,
  http,
  parseAbiItem,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";

import { baseSepolia } from "viem/chains";

const CONTRACT =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const CHAIN_ID = 84532;

const ABI = [
  {
    type: "function",
    name: "computeTokenId",
    stateMutability: "pure",
    inputs: [{ name: "viuId", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "metadataHashOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "viuIdOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

type RegistryRow = {
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

async function findMintTransfer(
  publicClient: ReturnType<typeof createPublicClient>,
  tokenId: bigint,
) {
  const latest = await publicClient.getBlockNumber();

  const maxLookback = 250_000n;
  const earliest =
    latest > maxLookback
      ? latest - maxLookback
      : 0n;

  const chunkSize = 9_000n;

  let toBlock = latest;

  while (toBlock >= earliest) {
    const candidateFrom =
      toBlock >= chunkSize
        ? toBlock - chunkSize + 1n
        : 0n;

    const fromBlock =
      candidateFrom < earliest
        ? earliest
        : candidateFrom;

    const logs = await publicClient.getLogs({
      address: CONTRACT,
      event: TRANSFER_EVENT,
      args: {
        from: zeroAddress,
        tokenId,
      },
      fromBlock,
      toBlock,
    });

    if (logs.length > 0) {
      return logs[0];
    }

    if (fromBlock === 0n || fromBlock === earliest) {
      break;
    }

    toBlock = fromBlock - 1n;
  }

  return null;
}

async function main() {
  const mintPermanentId = process.argv[2];

  if (!mintPermanentId) {
    throw new Error(
      "Usage: recover-viu-mint.ts <MINT permanent ID>",
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
    "=== Ichthion VIU Mint Recovery ===",
  );
  console.log("");

  // ----------------------------------------------------------
  // 1. Read canonical Registry state
  // ----------------------------------------------------------

  const { data, error } = await supabase.rpc(
    "get_viu_blockchain_reconciliation_payload",
    {
      p_mint_permanent_id: mintPermanentId,
    },
  );

  if (error) {
    throw new Error(
      `Could not read Registry state: ${error.message}`,
    );
  }

  const rows =
    (data as RegistryRow[] | null) ?? [];

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
  console.log(
    `Registry state: ${mint.mint_readiness_status} / ${mint.onchain_status}`,
  );
  console.log(
    `Asset state: ${mint.tokenization_status}`,
  );

  const recoverableFreshState =
    mint.mint_readiness_status ===
      "ready_for_future_mint" &&
    mint.onchain_status === "not_minted" &&
    mint.tokenization_status === "prepared";

  const alreadyPersistedState =
    mint.mint_readiness_status ===
      "minted_on_chain" &&
    mint.onchain_status === "minted" &&
    mint.tokenization_status === "tokenized";

  if (
    !recoverableFreshState &&
    !alreadyPersistedState
  ) {
    throw new Error(
      "Registry MINT is not in a recoverable blockchain state.",
    );
  }

  // ----------------------------------------------------------
  // 2. Compute deterministic token ID
  // ----------------------------------------------------------

  const tokenId =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "computeTokenId",
      args: [mint.future_token_id],
    });

  console.log("");
  console.log(
    `Deterministic token ID: ${tokenId}`,
  );

  // ----------------------------------------------------------
  // 3. Read actual token from blockchain
  //
  // IMPORTANT:
  // This script NEVER calls mintVIU().
  // If ownerOf fails because token does not exist,
  // recovery stops instead of minting.
  // ----------------------------------------------------------

  let owner: Address;

  try {
    owner = await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });
  } catch {
    throw new Error(
      "Token does not exist on-chain. Recovery will not mint it automatically.",
    );
  }

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

  const onchainViuId =
    await publicClient.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "viuIdOf",
      args: [tokenId],
    });

  console.log("");
  console.log("Blockchain token found:");
  console.log(`  owner = ${owner}`);
  console.log(`  token_uri = ${tokenUri}`);
  console.log(
    `  metadata_hash = ${metadataHash}`,
  );
  console.log(
    `  viu_id = ${onchainViuId}`,
  );

  // ----------------------------------------------------------
  // 4. Verify canonical identity BEFORE persistence
  // ----------------------------------------------------------

  if (onchainViuId !== mint.future_token_id) {
    throw new Error(
      "HARD CONFLICT: on-chain VIU ID does not match Registry.",
    );
  }

  const expectedMetadataHash =
    `0x${mint.onchain_metadata_hash}`.toLowerCase();

  if (
    metadataHash.toLowerCase() !==
    expectedMetadataHash
  ) {
    throw new Error(
      "HARD CONFLICT: on-chain metadata hash does not match Registry.",
    );
  }

  const canonicalTokenUri =
    `${supabaseUrl.replace(/\/$/, "")}` +
    `/storage/v1/object/public/viu-onchain-metadata/sha256/` +
    `${mint.onchain_metadata_hash}.json`;

  if (tokenUri !== canonicalTokenUri) {
    throw new Error(
      "HARD CONFLICT: on-chain tokenURI does not match canonical Registry metadata URI.",
    );
  }

  // ----------------------------------------------------------
  // 5. Discover original mint transaction from ERC-721
  // Transfer(0x0 → recipient)
  // ----------------------------------------------------------

  console.log("");
  console.log(
    "Searching for original mint transaction...",
  );

  const mintLog =
    await findMintTransfer(
      publicClient,
      tokenId,
    );

  if (!mintLog) {
    throw new Error(
      "Token exists, but original ERC-721 mint Transfer event could not be located.",
    );
  }

  const txHash =
    mintLog.transactionHash as Hex | null;

  const mintRecipient =
    mintLog.args.to as Address | undefined;

  if (!txHash) {
    throw new Error(
      "Mint Transfer event has no transaction hash.",
    );
  }

  if (!mintRecipient) {
    throw new Error(
      "Mint Transfer event has no recipient.",
    );
  }

  const receipt =
    await publicClient.getTransactionReceipt({
      hash: txHash,
    });

  if (receipt.status !== "success") {
    throw new Error(
      "Original mint transaction did not succeed.",
    );
  }

  console.log(
    `Mint transaction: ${txHash}`,
  );
  console.log(
    `Mint block: ${receipt.blockNumber}`,
  );
  console.log(
    `Mint recipient: ${mintRecipient}`,
  );

  // ----------------------------------------------------------
  // 6. Persist/reconcile actual chain result
  //
  // confirm_viu_blockchain_mint is now idempotent:
  // - fresh Registry state -> persists
  // - already identical state -> returns success
  // - different identity -> hard conflict
  // ----------------------------------------------------------

  console.log("");
  console.log(
    "Persisting verified blockchain result into Registry...",
  );

  const {
    data: confirmation,
    error: confirmationError,
  } = await supabase.rpc(
    "confirm_viu_blockchain_mint",
    {
      p_mint_permanent_id:
        mint.mint_permanent_id,

      p_chain_id:
        CHAIN_ID,

      p_contract_address:
        CONTRACT,

      p_token_id:
        tokenId.toString(),

      p_token_uri:
        tokenUri,

      p_token_tx_hash:
        txHash,

      p_wallet_address:
        mintRecipient,
    },
  );

  if (confirmationError) {
    throw new Error(
      `Registry recovery persistence failed: ${confirmationError.message}`,
    );
  }

  console.log("");
  console.log("Recovered Registry state:");
  console.dir(
    confirmation,
    {
      depth: null,
    },
  );

  console.log("");
  console.log(
    "PASS: Existing on-chain VIU was verified and safely reconciled into Registry without re-minting.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: VIU mint recovery failed.",
  );
  console.error(error);
  process.exitCode = 1;
});