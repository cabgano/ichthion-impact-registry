import { createHash } from "node:crypto";
import {
  dirname,
  resolve,
} from "node:path";
import {
  loadEnvFile,
} from "node:process";
import {
  fileURLToPath,
} from "node:url";

import { network } from "hardhat";

import type {
  Address,
  Hex,
} from "viem";

import {
  assessSafeBlockchainMint,
  buildCanonicalViuMetadataTokenUri,
  readExistingViuToken,
  VIU_BLOCKCHAIN_TEST_CONFIG,
  type PreparedViuMintPayload,
} from "../../src/lib/blockchain/viu-mint-adapter";

import {
  ICHTHION_VIU_ABI,
} from "../../src/lib/blockchain/ichthion-viu-abi";

/* ============================================================
 * ENVIRONMENT
 * ============================================================
 */

const SCRIPT_DIR =
  dirname(
    fileURLToPath(import.meta.url),
  );

const REPO_ROOT =
  resolve(
    SCRIPT_DIR,
    "../..",
  );

loadEnvFile(
  resolve(
    REPO_ROOT,
    ".env.local",
  ),
);

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    "Supabase server configuration is incomplete.",
  );
}

/* ============================================================
 * HELPERS
 * ============================================================
 */

function sleep(
  milliseconds: number,
) {
  return new Promise(
    (resolvePromise) =>
      setTimeout(
        resolvePromise,
        milliseconds,
      ),
  );
}

function sha256Hex(
  value: Buffer,
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

async function supabaseRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
      {
        method: "POST",

        headers: {
          apikey:
            SUPABASE_SERVICE_ROLE_KEY!,

          Authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(body),
      },
    );

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase RPC ${functionName} failed (${response.status}): ${responseText}`,
    );
  }

  if (!responseText.trim()) {
    return undefined as T;
  }

  return JSON.parse(
    responseText,
  ) as T;
}

/* ============================================================
 * PREPARED REGISTRY PAYLOAD
 * ============================================================
 */

async function getPreparedMintPayload(
  mintPermanentId: string,
): Promise<PreparedViuMintPayload> {
  const rows =
    await supabaseRpc<
      PreparedViuMintPayload[]
    >(
      "get_prepared_viu_blockchain_mint_payload",
      {
        p_mint_permanent_id:
          mintPermanentId,
      },
    );

  const payload =
    rows?.[0];

  if (!payload) {
    throw new Error(
      `Prepared Registry MINT not found: ${mintPermanentId}`,
    );
  }

  return payload;
}

/* ============================================================
 * METADATA PUBLICATION VERIFICATION
 * ============================================================
 */

async function verifyCanonicalMetadataPublication(
  payload: PreparedViuMintPayload,
  tokenUri: string,
) {
  console.log("");
  console.log(
    "Verifying canonical metadata publication...",
  );

  const response =
    await fetch(tokenUri);

  if (!response.ok) {
    throw new Error(
      `Canonical metadata is not publicly available: HTTP ${response.status}`,
    );
  }

  const rawBytes =
    Buffer.from(
      await response.arrayBuffer(),
    );

  const downloadedHash =
    sha256Hex(rawBytes);

  if (
    downloadedHash.toLowerCase() !==
    payload.onchain_metadata_hash.toLowerCase()
  ) {
    throw new Error(
      "Published metadata SHA256 does not match Registry onchain_metadata_hash.",
    );
  }

  const downloadedText =
    rawBytes.toString("utf8");

  if (
    downloadedText !==
    payload.canonical_metadata_text
  ) {
    throw new Error(
      "Published metadata bytes differ from Registry canonical metadata.",
    );
  }

  console.log(
    `Metadata bytes: ${rawBytes.length}`,
  );

  console.log(
    `Metadata hash: ${downloadedHash}`,
  );

  console.log(
    "Metadata publication: PASS",
  );
}

/* ============================================================
 * REGISTRY PERSISTENCE
 * ============================================================
 */

async function confirmRegistryMint(
  args: {
    mintPermanentId: string;

    tokenId: bigint;

    tokenUri: string;

    transactionHash: Hex;

    walletAddress: Address;
  },
) {
  return supabaseRpc<unknown[]>(
    "confirm_viu_blockchain_mint",
    {
      p_mint_permanent_id:
        args.mintPermanentId,

      p_chain_id:
        VIU_BLOCKCHAIN_TEST_CONFIG.chainId,

      p_contract_address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      p_token_id:
        args.tokenId.toString(),

      p_token_uri:
        args.tokenUri,

      p_token_tx_hash:
        args.transactionHash,

      p_wallet_address:
        args.walletAddress,
    },
  );
}

/* ============================================================
 * POST-TRANSACTION VERIFICATION WITH RPC-LAG RETRY
 * ============================================================
 */

async function waitForOnchainToken(
  args: {
    tokenId: bigint;

    futureTokenId: string;

    metadataHash: Hex;

    tokenUri: string;

    recipient: Address;
  },
) {
  const maximumAttempts =
    12;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    const token =
      await readExistingViuToken(
        args.tokenId,
      );

    if (token) {
      if (
        token.viuId !==
        args.futureTokenId
      ) {
        throw new Error(
          "HARD CONFLICT: minted token contains unexpected VIU ID.",
        );
      }

      if (
        token.metadataHash
          .toLowerCase() !==
        args.metadataHash
          .toLowerCase()
      ) {
        throw new Error(
          "HARD CONFLICT: minted token contains unexpected metadata hash.",
        );
      }

      if (
        token.tokenUri !==
        args.tokenUri
      ) {
        throw new Error(
          "HARD CONFLICT: minted token contains unexpected tokenURI.",
        );
      }

      if (
        token.currentOwner
          .toLowerCase() !==
        args.recipient
          .toLowerCase()
      ) {
        throw new Error(
          "HARD CONFLICT: minted token owner differs from expected recipient.",
        );
      }

      return token;
    }

    console.log(
      `On-chain read not available yet (${attempt}/${maximumAttempts}). Retrying...`,
    );

    await sleep(2000);
  }

  return null;
}

/* ============================================================
 * MAIN
 * ============================================================
 */

async function main() {
  const mintPermanentId =
    process.argv[2];

  if (!mintPermanentId) {
    throw new Error(
      "Usage: execute-safe-registry-viu-mint.ts <MINT permanent ID>",
    );
  }

  console.log("");
  console.log(
    "=== Ichthion Safe Registry VIU Mint Executor ===",
  );
  console.log("");

  /* ----------------------------------------------------------
   * 1. Registry preparation
   * ----------------------------------------------------------
   */

  const payload =
    await getPreparedMintPayload(
      mintPermanentId,
    );

  console.log(
    `MINT: ${payload.permanent_id}`,
  );

  console.log(
    `VIU: ${payload.future_token_id}`,
  );

  console.log(
    `Registry state: ${payload.mint_readiness_status} / ${payload.onchain_status}`,
  );

  /* ----------------------------------------------------------
   * 2. Canonical public metadata URI
   * ----------------------------------------------------------
   */

  const canonicalTokenUri =
    buildCanonicalViuMetadataTokenUri(
      SUPABASE_URL!,
      payload.onchain_metadata_hash,
    );

  console.log("");
  console.log(
    `Canonical token URI: ${canonicalTokenUri}`,
  );

  await verifyCanonicalMetadataPublication(
    payload,
    canonicalTokenUri,
  );

  /* ----------------------------------------------------------
   * 3. Safe assessment
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "Running safe mint assessment...",
  );

  const assessment =
    await assessSafeBlockchainMint(
      payload,
      canonicalTokenUri,
    );

  console.log(
    `Safe action: ${assessment.action.toUpperCase()}`,
  );

  /* ==========================================================
   * RECOVERY PATH
   *
   * Blockchain already contains the canonical VIU.
   * ZERO mint transactions are sent.
   * ==========================================================
   */

  if (
    assessment.action ===
    "recover"
  ) {
    console.log("");
    console.log(
      "Existing canonical token detected.",
    );

    console.log(
      "NO new mint transaction will be sent.",
    );

    console.log(
      `Original mint tx: ${assessment.mintEvidence.transactionHash}`,
    );

    console.log(
      `Original mint block: ${assessment.mintEvidence.blockNumber}`,
    );

    console.log(
      `Original recipient: ${assessment.mintEvidence.mintRecipient}`,
    );

    console.log("");
    console.log(
      "Persisting recovered blockchain identity into Registry...",
    );

    const result =
      await confirmRegistryMint({
        mintPermanentId:
          payload.permanent_id,

        tokenId:
          assessment.contractTokenId,

        tokenUri:
          assessment.existingToken.tokenUri,

        transactionHash:
          assessment.mintEvidence
            .transactionHash,

        walletAddress:
          assessment.mintEvidence
            .mintRecipient,
      });

    console.log("");
    console.log(
      "Registry result:",
    );

    console.dir(
      result,
      {
        depth: null,
      },
    );

    console.log("");
    console.log(
      "PASS: Existing on-chain VIU safely recovered without re-minting.",
    );

    return;
  }

  /* ==========================================================
   * REAL MINT PATH
   * ==========================================================
   */

  console.log("");
  console.log(
    "Token does not exist on-chain.",
  );

  console.log(
    "Contract simulation: PASS",
  );

  /* ----------------------------------------------------------
   * 4. Connect Hardhat signer
   * ----------------------------------------------------------
   */

  const { viem } =
    await network.connect(
      "baseSepolia",
    );

  const publicClient =
    await viem.getPublicClient();

  const walletClients =
    await viem.getWalletClients();

  const walletClient =
    walletClients[0];

  if (!walletClient) {
    throw new Error(
      "No Base Sepolia wallet client found.",
    );
  }

  const chainId =
    await publicClient.getChainId();

  if (
    chainId !==
    VIU_BLOCKCHAIN_TEST_CONFIG.chainId
  ) {
    throw new Error(
      `Unexpected chain ID: ${chainId}`,
    );
  }

  const operator =
    walletClient.account.address;

  if (
    operator.toLowerCase() !==
    assessment.prepared.operator.toLowerCase()
  ) {
    throw new Error(
      `Hardhat signer ${operator} does not match configured VIU minter ${assessment.prepared.operator}.`,
    );
  }

  console.log("");
  console.log(
    `Operator: ${operator}`,
  );

  console.log(
    `Recipient: ${assessment.prepared.recipient}`,
  );

  console.log(
    `Token ID: ${assessment.contractTokenId}`,
  );

  /* ----------------------------------------------------------
   * 5. Send exactly one real mint transaction
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "Sending REAL Base Sepolia mint transaction...",
  );

  const txHash =
    await walletClient.writeContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        ICHTHION_VIU_ABI,

      functionName:
        "mintVIU",

      args: [
        assessment.prepared.recipient,
        assessment.prepared.futureTokenId,
        assessment.prepared.metadataHash,
        assessment.prepared.tokenUri,
      ],

      chain:
        walletClient.chain,

      account:
        walletClient.account,
    });

  console.log("");
  console.log(
    `Transaction hash: ${txHash}`,
  );

  console.log("");
  console.log(
    "Waiting for transaction receipt...",
  );

  const receipt =
    await publicClient.waitForTransactionReceipt({
      hash:
        txHash,

      confirmations:
        2,
    });

  console.log(
    `Receipt status: ${receipt.status}`,
  );

  console.log(
    `Block number: ${receipt.blockNumber}`,
  );

  if (
    receipt.status !==
    "success"
  ) {
    throw new Error(
      `Mint transaction failed: ${txHash}`,
    );
  }

  /* ----------------------------------------------------------
   * IMPORTANT SAFETY RULE
   *
   * From this point onward the transaction has succeeded.
   * We NEVER attempt another mint in this process.
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "Transaction succeeded.",
  );

  console.log(
    "Verifying token state with RPC-lag protection...",
  );

  const verifiedToken =
    await waitForOnchainToken({
      tokenId:
        assessment.contractTokenId,

      futureTokenId:
        assessment.prepared.futureTokenId,

      metadataHash:
        assessment.prepared.metadataHash,

      tokenUri:
        assessment.prepared.tokenUri,

      recipient:
        assessment.prepared.recipient,
    });

  if (!verifiedToken) {
    console.log("");
    console.log(
      "IMPORTANT: blockchain transaction SUCCEEDED but token reads are not yet available through the RPC.",
    );

    console.log(
      `Successful transaction: ${txHash}`,
    );

    console.log(
      "DO NOT manually mint this VIU again.",
    );

    console.log(
      "Safely rerun this same executor later. Its preflight will detect the existing token and enter RECOVER instead of MINT.",
    );

    throw new Error(
      "Successful blockchain mint awaiting RPC reconciliation.",
    );
  }

  console.log("");
  console.log(
    "On-chain verification: PASS",
  );

  console.log(
    `Owner: ${verifiedToken.currentOwner}`,
  );

  console.log(
    `Token URI: ${verifiedToken.tokenUri}`,
  );

  console.log(
    `Metadata hash: ${verifiedToken.metadataHash}`,
  );

  /* ----------------------------------------------------------
   * 6. Persist successful blockchain identity atomically
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "Persisting blockchain identity into Registry...",
  );

  const result =
    await confirmRegistryMint({
      mintPermanentId:
        payload.permanent_id,

      tokenId:
        assessment.contractTokenId,

      tokenUri:
        assessment.prepared.tokenUri,

      transactionHash:
        txHash,

      walletAddress:
        assessment.prepared.recipient,
    });

  console.log("");
  console.log(
    "Registry result:",
  );

  console.dir(
    result,
    {
      depth: null,
    },
  );

  console.log("");
  console.log(
    "PASS: VIU safely minted, verified and persisted.",
  );

  console.log("");
  console.log("RESULT");

  console.log(
    `action=mint`,
  );

  console.log(
    `tx_hash=${txHash}`,
  );

  console.log(
    `token_id=${assessment.contractTokenId}`,
  );

  console.log(
    `wallet_address=${assessment.prepared.recipient}`,
  );

  console.log(
    `token_uri=${assessment.prepared.tokenUri}`,
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "FAIL: Safe Registry VIU mint executor failed.",
    );

    console.error(error);

    process.exitCode = 1;
  },
);