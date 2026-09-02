import { createHash } from "node:crypto";

import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseAbiItem,
  toHex,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";

import { baseSepolia } from "viem/chains";

import { ICHTHION_VIU_ABI } from "./ichthion-viu-abi";

export const VIU_BLOCKCHAIN_TEST_CONFIG = {
  chainId: 84532,

  contractAddress:
    "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address,

  operatorAddress:
    "0x3d54de9023a7dea18f8974809cbd650d3ceaf3be" as Address,

  rpcUrl: "https://sepolia.base.org",
} as const;

/* ============================================================
 * TYPES
 * ============================================================
 */

export type PreparedViuMintPayload = {
  id: string;
  permanent_id: string;
  future_token_id: string;

  allocation_status: string;
  asset_status: string;

  mint_readiness_status: string;
  onchain_status: string;
  can_be_minted_later: boolean;

  onchain_metadata_hash: string;
  canonical_metadata_text: string;

  token_uri: string | null;
  wallet_address: string | null;
};

export type PreparedBlockchainMint = {
  mintPermanentId: string;
  futureTokenId: string;

  recipient: Address;
  recipientSource:
    | "prepared_wallet"
    | "ichthion_test_wallet";

  operator: Address;

  metadataHash: Hex;

  tokenUri: string;
  tokenUriSource:
    | "prepared_uri"
    | "canonical_uri"
    | "simulation_urn";

  expectedTokenId: bigint;

  canonicalMetadataHashMatches: boolean;
};

export type SimulatedBlockchainMint =
  PreparedBlockchainMint & {
    contractTokenId: bigint;
    simulatedTokenId: bigint;
    simulationPassed: boolean;
  };

export type ExistingOnchainViu = {
  tokenId: bigint;

  viuId: string;
  metadataHash: Hex;
  tokenUri: string;

  currentOwner: Address;
};

export type ViuMintEvidence = {
  transactionHash: Hex;
  blockNumber: bigint;
  mintRecipient: Address;
};

export type SafeMintAssessment =
  | {
      action: "mint";

      prepared: PreparedBlockchainMint;

      contractTokenId: bigint;

      tokenExists: false;

      simulationPassed: true;
    }
  | {
      action: "recover";

      prepared: PreparedBlockchainMint;

      contractTokenId: bigint;

      tokenExists: true;

      existingToken: ExistingOnchainViu;

      mintEvidence: ViuMintEvidence;
    };

/* ============================================================
 * CLIENT
 * ============================================================
 */

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    VIU_BLOCKCHAIN_TEST_CONFIG.rpcUrl,
  ),
});

/* ============================================================
 * READ-ONLY ABI USED BY SAFETY / RECONCILIATION
 * ============================================================
 */

const VIU_READ_ABI = [
  {
    type: "error",
    name: "ERC721NonexistentToken",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "computeTokenId",
    stateMutability: "pure",
    inputs: [
      {
        name: "viuId",
        type: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },

  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },

  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },

  {
    type: "function",
    name: "metadataHashOf",
    stateMutability: "view",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },

  {
    type: "function",
    name: "viuIdOf",
    stateMutability: "view",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
] as const;

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

/* ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

function normalizeMetadataHash(
  value: string,
): Hex {
  const normalized = value
    .trim()
    .replace(/^0x/i, "");

  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      "Invalid onchain_metadata_hash. Expected exactly 64 hexadecimal characters.",
    );
  }

  return `0x${normalized}` as Hex;
}

function sha256Hex(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function validatePreparedPayload(
  payload: PreparedViuMintPayload,
  options?: {
    allowAlreadyMinted?: boolean;
  },
) {
  if (payload.allocation_status !== "issued") {
    throw new Error(
      `Allocation is not issued: ${payload.allocation_status}`,
    );
  }

  if (payload.asset_status !== "allocated") {
    throw new Error(
      `VIU asset is not allocated: ${payload.asset_status}`,
    );
  }

  const preparedState =
    payload.mint_readiness_status ===
      "ready_for_future_mint" &&
    payload.onchain_status ===
      "not_minted";

  const alreadyMintedState =
    payload.mint_readiness_status ===
      "minted_on_chain" &&
    payload.onchain_status ===
      "minted";

  if (!preparedState) {
    if (
      !options?.allowAlreadyMinted ||
      !alreadyMintedState
    ) {
      throw new Error(
        `VIU is not in a valid blockchain execution state: ${payload.mint_readiness_status} / ${payload.onchain_status}`,
      );
    }
  }

  /*
   * can_be_minted_later applies to a new mint attempt.
   *
   * An already-minted VIU may legitimately report false here;
   * it still needs to be accepted for idempotent reconciliation.
   */
  if (
    preparedState &&
    payload.can_be_minted_later !== true
  ) {
    throw new Error(
      "Registry reports that this VIU cannot be minted.",
    );
  }

  const canonicalHash =
    sha256Hex(
      payload.canonical_metadata_text,
    );

  if (
    canonicalHash.toLowerCase() !==
    payload.onchain_metadata_hash.toLowerCase()
  ) {
    throw new Error(
      "Canonical metadata integrity verification failed.",
    );
  }
}

function resolveRecipient(
  walletAddress: string | null,
): {
  recipient: Address;
  source:
    | "prepared_wallet"
    | "ichthion_test_wallet";
} {
  const prepared =
    walletAddress?.trim();

  if (prepared) {
    if (!isAddress(prepared)) {
      throw new Error(
        `Invalid prepared wallet_address: ${prepared}`,
      );
    }

    return {
      recipient:
        getAddress(prepared),

      source:
        "prepared_wallet",
    };
  }

  return {
    recipient:
      getAddress(
        VIU_BLOCKCHAIN_TEST_CONFIG.operatorAddress,
      ),

    source:
      "ichthion_test_wallet",
  };
}

function resolveSimulationTokenUri(
  payload: PreparedViuMintPayload,
): {
  uri: string;
  source:
    | "prepared_uri"
    | "simulation_urn";
} {
  const preparedUri =
    payload.token_uri?.trim();

  if (preparedUri) {
    return {
      uri: preparedUri,
      source: "prepared_uri",
    };
  }

  return {
    uri:
      "urn:ichthion:viu-metadata:sha256:" +
      payload.onchain_metadata_hash,

    source:
      "simulation_urn",
  };
}

function resolveExecutableTokenUri(
  payload: PreparedViuMintPayload,
  canonicalTokenUri: string,
): {
  uri: string;
  source:
    | "prepared_uri"
    | "canonical_uri";
} {
  const supplied =
    canonicalTokenUri.trim();

  if (!supplied) {
    throw new Error(
      "Canonical token URI is required for a real blockchain mint.",
    );
  }

  if (
    supplied.startsWith(
      "urn:ichthion:viu-metadata:sha256:",
    )
  ) {
    throw new Error(
      "Simulation token URI cannot be used for a real blockchain mint.",
    );
  }

  const preparedUri =
    payload.token_uri?.trim();

  if (
    preparedUri &&
    preparedUri !== supplied
  ) {
    throw new Error(
      "Prepared token_uri conflicts with supplied canonical token URI.",
    );
  }

  if (preparedUri) {
    return {
      uri: preparedUri,
      source: "prepared_uri",
    };
  }

  return {
    uri: supplied,
    source: "canonical_uri",
  };
}

/* ============================================================
 * CANONICAL METADATA URI
 * ============================================================
 */

export function buildCanonicalViuMetadataTokenUri(
  supabaseUrl: string,
  metadataHash: string,
): string {
  const normalizedHash =
    normalizeMetadataHash(
      metadataHash,
    )
      .slice(2)
      .toLowerCase();

  const baseUrl =
    supabaseUrl
      .trim()
      .replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error(
      "Supabase URL is required.",
    );
  }

  return (
    `${baseUrl}` +
    "/storage/v1/object/public/" +
    "viu-onchain-metadata/" +
    `sha256/${normalizedHash}.json`
  );
}

/* ============================================================
 * PREPARE — SIMULATION
 *
 * Legacy 11A.5 simulation remains STRICT:
 * only ready_for_future_mint / not_minted.
 * ============================================================
 */

export function prepareBlockchainMint(
  payload: PreparedViuMintPayload,
): PreparedBlockchainMint {
  validatePreparedPayload(payload);

  const metadataHash =
    normalizeMetadataHash(
      payload.onchain_metadata_hash,
    );

  const {
    recipient,
    source: recipientSource,
  } = resolveRecipient(
    payload.wallet_address,
  );

  const {
    uri: tokenUri,
    source: tokenUriSource,
  } = resolveSimulationTokenUri(
    payload,
  );

  const expectedTokenId =
    BigInt(
      keccak256(
        toHex(
          payload.future_token_id,
        ),
      ),
    );

  return {
    mintPermanentId:
      payload.permanent_id,

    futureTokenId:
      payload.future_token_id,

    recipient,
    recipientSource,

    operator:
      getAddress(
        VIU_BLOCKCHAIN_TEST_CONFIG.operatorAddress,
      ),

    metadataHash,

    tokenUri,
    tokenUriSource,

    expectedTokenId,

    canonicalMetadataHashMatches:
      true,
  };
}

/* ============================================================
 * PREPARE — REAL EXECUTION / SAFE RETRY
 *
 * Allows:
 * - ready_for_future_mint / not_minted
 * - minted_on_chain / minted
 *
 * The latter is required so the executor can safely retry
 * an already completed mint and enter RECOVER instead of
 * trying another blockchain transaction.
 * ============================================================
 */

export function prepareExecutableBlockchainMint(
  payload: PreparedViuMintPayload,
  canonicalTokenUri: string,
): PreparedBlockchainMint {
  validatePreparedPayload(
    payload,
    {
      allowAlreadyMinted: true,
    },
  );

  const metadataHash =
    normalizeMetadataHash(
      payload.onchain_metadata_hash,
    );

  const {
    recipient,
    source: recipientSource,
  } = resolveRecipient(
    payload.wallet_address,
  );

  const {
    uri: tokenUri,
    source: tokenUriSource,
  } = resolveExecutableTokenUri(
    payload,
    canonicalTokenUri,
  );

  const expectedTokenId =
    BigInt(
      keccak256(
        toHex(
          payload.future_token_id,
        ),
      ),
    );

  return {
    mintPermanentId:
      payload.permanent_id,

    futureTokenId:
      payload.future_token_id,

    recipient,
    recipientSource,

    operator:
      getAddress(
        VIU_BLOCKCHAIN_TEST_CONFIG.operatorAddress,
      ),

    metadataHash,

    tokenUri,
    tokenUriSource,

    expectedTokenId,

    canonicalMetadataHashMatches:
      true,
  };
}

/* ============================================================
 * EXISTENCE CHECK
 * ============================================================
 */

export async function readExistingViuToken(
  tokenId: bigint,
): Promise<ExistingOnchainViu | null> {
  let owner: Address;

  try {
    owner =
      await publicClient.readContract({
        address:
          VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

        abi:
          VIU_READ_ABI,

        functionName:
          "ownerOf",

        args: [
          tokenId,
        ],
      });
  } catch (error) {
    /*
     * Safety rule:
     *
     * ONLY ERC721NonexistentToken means "token absent".
     *
     * We must not convert arbitrary RPC/contract failures into
     * "token does not exist", because that could incorrectly
     * open the MINT path.
     */
    if (error instanceof BaseError) {
      const revertError =
        error.walk(
          (entry) =>
            entry instanceof
            ContractFunctionRevertedError,
        );

      if (
        revertError instanceof
          ContractFunctionRevertedError &&
        revertError.data?.errorName ===
          "ERC721NonexistentToken"
      ) {
        return null;
      }
    }

    throw error;
  }

  const [
    viuId,
    metadataHash,
    tokenUri,
  ] = await Promise.all([
    publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        VIU_READ_ABI,

      functionName:
        "viuIdOf",

      args: [
        tokenId,
      ],
    }),

    publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        VIU_READ_ABI,

      functionName:
        "metadataHashOf",

      args: [
        tokenId,
      ],
    }),

    publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        VIU_READ_ABI,

      functionName:
        "tokenURI",

      args: [
        tokenId,
      ],
    }),
  ]);

  return {
    tokenId,

    viuId,

    metadataHash,

    tokenUri,

    currentOwner:
      getAddress(owner),
  };
}

/* ============================================================
 * ORIGINAL MINT TRANSACTION DISCOVERY
 * ============================================================
 */

export async function findViuMintEvidence(
  tokenId: bigint,
): Promise<ViuMintEvidence | null> {
  const latestBlock =
    await publicClient.getBlockNumber();

  /*
   * Testnet safety window.
   *
   * 11B can replace this with a deployment-block based
   * production indexer / event strategy.
   */
  const maximumLookback =
    250_000n;

  const earliestBlock =
    latestBlock > maximumLookback
      ? latestBlock - maximumLookback
      : 0n;

  const chunkSize =
    9_000n;

  let toBlock =
    latestBlock;

  while (
    toBlock >= earliestBlock
  ) {
    const candidateFromBlock =
      toBlock >= chunkSize
        ? toBlock - chunkSize + 1n
        : 0n;

    const fromBlock =
      candidateFromBlock <
      earliestBlock
        ? earliestBlock
        : candidateFromBlock;

    const logs =
      await publicClient.getLogs({
        address:
          VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

        event:
          TRANSFER_EVENT,

        args: {
          from:
            zeroAddress,

          tokenId,
        },

        fromBlock,
        toBlock,
      });

    if (logs.length > 0) {
      const log =
        logs[0];

      const transactionHash =
        log.transactionHash;

      const mintRecipient =
        log.args.to;

      if (
        !transactionHash ||
        !mintRecipient
      ) {
        throw new Error(
          "Mint Transfer event is missing blockchain identity.",
        );
      }

      const receipt =
        await publicClient.getTransactionReceipt({
          hash:
            transactionHash,
        });

      if (
        receipt.status !==
        "success"
      ) {
        throw new Error(
          "Original VIU mint transaction did not succeed.",
        );
      }

      return {
        transactionHash,

        blockNumber:
          receipt.blockNumber,

        mintRecipient:
          getAddress(
            mintRecipient,
          ),
      };
    }

    if (
      fromBlock === 0n ||
      fromBlock === earliestBlock
    ) {
      break;
    }

    toBlock =
      fromBlock - 1n;
  }

  return null;
}

/* ============================================================
 * SIMULATION — EXISTING 11A.5 FLOW
 * ============================================================
 */

export async function simulatePreparedBlockchainMint(
  payload: PreparedViuMintPayload,
): Promise<SimulatedBlockchainMint> {
  const prepared =
    prepareBlockchainMint(
      payload,
    );

  const contractTokenId =
    await publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        VIU_READ_ABI,

      functionName:
        "computeTokenId",

      args: [
        prepared.futureTokenId,
      ],
    });

  if (
    contractTokenId !==
    prepared.expectedTokenId
  ) {
    throw new Error(
      "Adapter tokenId does not match smart-contract tokenId.",
    );
  }

  const simulation =
    await publicClient.simulateContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        ICHTHION_VIU_ABI,

      functionName:
        "mintVIU",

      account:
        prepared.operator,

      args: [
        prepared.recipient,
        prepared.futureTokenId,
        prepared.metadataHash,
        prepared.tokenUri,
      ],
    });

  const simulatedTokenId =
    simulation.result;

  if (
    simulatedTokenId !==
    prepared.expectedTokenId
  ) {
    throw new Error(
      "Simulated mint returned an unexpected tokenId.",
    );
  }

  return {
    ...prepared,

    contractTokenId,
    simulatedTokenId,

    simulationPassed:
      true,
  };
}

/* ============================================================
 * 11A.8 SAFE MINT ASSESSMENT
 *
 * This function NEVER sends a transaction.
 *
 * It determines whether the caller should:
 *
 *   MINT
 *     Registry is prepared.
 *     Token does not exist.
 *     Contract simulation passes.
 *
 *   RECOVER
 *     Token already exists.
 *     Exact canonical identity is verified.
 *     Original mint transaction is recovered.
 *
 *   HARD CONFLICT
 *     Registry/blockchain identity is inconsistent.
 *
 * This is the idempotent safety gate that must run before
 * any real blockchain mint attempt.
 * ============================================================
 */

export async function assessSafeBlockchainMint(
  payload: PreparedViuMintPayload,
  canonicalTokenUri: string,
): Promise<SafeMintAssessment> {
  const prepared =
    prepareExecutableBlockchainMint(
      payload,
      canonicalTokenUri,
    );

  const registryAlreadyMinted =
    payload.mint_readiness_status ===
      "minted_on_chain" &&
    payload.onchain_status ===
      "minted";

  const contractTokenId =
    await publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi:
        VIU_READ_ABI,

      functionName:
        "computeTokenId",

      args: [
        prepared.futureTokenId,
      ],
    });

  if (
    contractTokenId !==
    prepared.expectedTokenId
  ) {
    throw new Error(
      "HARD CONFLICT: adapter tokenId does not match smart-contract tokenId.",
    );
  }

  /* ----------------------------------------------------------
   * Does deterministic token already exist?
   * ----------------------------------------------------------
   */

  const existingToken =
    await readExistingViuToken(
      contractTokenId,
    );

  /* ----------------------------------------------------------
   * TOKEN DOES NOT EXIST
   * ----------------------------------------------------------
   */

  if (!existingToken) {
    /*
     * Registry claims the mint already happened, therefore
     * absence of the deterministic token is NOT a valid reason
     * to attempt another mint.
     */
    if (registryAlreadyMinted) {
      throw new Error(
        "HARD CONFLICT: Registry says VIU is minted, but deterministic token does not exist on-chain.",
      );
    }

    /*
     * Fresh prepared state:
     * simulate first, then caller may send exactly one mint.
     */
    const simulation =
      await publicClient.simulateContract({
        address:
          VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

        abi:
          ICHTHION_VIU_ABI,

        functionName:
          "mintVIU",

        account:
          prepared.operator,

        args: [
          prepared.recipient,
          prepared.futureTokenId,
          prepared.metadataHash,
          prepared.tokenUri,
        ],
      });

    if (
      simulation.result !==
      prepared.expectedTokenId
    ) {
      throw new Error(
        "Mint simulation returned an unexpected tokenId.",
      );
    }

    return {
      action:
        "mint",

      prepared,

      contractTokenId,

      tokenExists:
        false,

      simulationPassed:
        true,
    };
  }

  /* ----------------------------------------------------------
   * TOKEN ALREADY EXISTS
   *
   * Do NOT mint again.
   * Verify exact canonical identity instead.
   * ----------------------------------------------------------
   */

  if (
    existingToken.viuId !==
    prepared.futureTokenId
  ) {
    throw new Error(
      "HARD CONFLICT: existing on-chain token has a different VIU ID.",
    );
  }

  if (
    existingToken.metadataHash
      .toLowerCase() !==
    prepared.metadataHash
      .toLowerCase()
  ) {
    throw new Error(
      "HARD CONFLICT: existing on-chain token has a different metadata hash.",
    );
  }

  if (
    existingToken.tokenUri !==
    prepared.tokenUri
  ) {
    throw new Error(
      "HARD CONFLICT: existing on-chain token has a different tokenURI.",
    );
  }

  /* ----------------------------------------------------------
   * Recover original mint transaction.
   * ----------------------------------------------------------
   */

  const mintEvidence =
    await findViuMintEvidence(
      contractTokenId,
    );

  if (!mintEvidence) {
    throw new Error(
      "HARD CONFLICT: token exists but original mint transaction could not be recovered.",
    );
  }

  /*
   * The original mint recipient must match the recipient
   * prepared by the Registry.
   *
   * We compare against original mint recipient rather than
   * current owner because controlled transfers may happen
   * after minting.
   */
  if (
    mintEvidence.mintRecipient
      .toLowerCase() !==
    prepared.recipient
      .toLowerCase()
  ) {
    throw new Error(
      "HARD CONFLICT: existing token was minted to a different recipient.",
    );
  }

  return {
    action:
      "recover",

    prepared,

    contractTokenId,

    tokenExists:
      true,

    existingToken,

    mintEvidence,
  };
}