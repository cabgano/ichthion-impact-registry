import { createHash } from "node:crypto";

import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  toHex,
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

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    VIU_BLOCKCHAIN_TEST_CONFIG.rpcUrl,
  ),
});

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

function sha256Hex(value: string): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function resolveRecipient(
  walletAddress: string | null,
): {
  recipient: Address;
  source:
    | "prepared_wallet"
    | "ichthion_test_wallet";
} {
  const prepared = walletAddress?.trim();

  if (prepared) {
    if (!isAddress(prepared)) {
      throw new Error(
        `Invalid prepared wallet_address: ${prepared}`,
      );
    }

    return {
      recipient: getAddress(prepared),
      source: "prepared_wallet",
    };
  }

  return {
    recipient: getAddress(
      VIU_BLOCKCHAIN_TEST_CONFIG.operatorAddress,
    ),
    source: "ichthion_test_wallet",
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
  const preparedUri = payload.token_uri?.trim();

  if (preparedUri) {
    return {
      uri: preparedUri,
      source: "prepared_uri",
    };
  }

  /*
   * 11A.5 simulation only.
   *
   * No canonical token URI has been persisted yet.
   * This value is never written to the Registry
   * and no transaction is sent.
   */
  return {
    uri:
      "urn:ichthion:viu-metadata:sha256:" +
      payload.onchain_metadata_hash,
    source: "simulation_urn",
  };
}

export function prepareBlockchainMint(
  payload: PreparedViuMintPayload,
): PreparedBlockchainMint {
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

  if (
    payload.mint_readiness_status !==
    "ready_for_future_mint"
  ) {
    throw new Error(
      `VIU is not ready_for_future_mint: ${payload.mint_readiness_status}`,
    );
  }

  if (payload.onchain_status !== "not_minted") {
    throw new Error(
      `VIU cannot be minted from onchain_status=${payload.onchain_status}`,
    );
  }

  if (payload.can_be_minted_later !== true) {
    throw new Error(
      "Registry reports that this VIU cannot be minted.",
    );
  }

  const canonicalHash = sha256Hex(
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

  const metadataHash = normalizeMetadataHash(
    payload.onchain_metadata_hash,
  );

  const {
    recipient,
    source: recipientSource,
  } = resolveRecipient(payload.wallet_address);

  const {
    uri: tokenUri,
    source: tokenUriSource,
  } = resolveSimulationTokenUri(payload);

  const expectedTokenId = BigInt(
    keccak256(
      toHex(payload.future_token_id),
    ),
  );

  return {
    mintPermanentId: payload.permanent_id,
    futureTokenId: payload.future_token_id,

    recipient,
    recipientSource,

    operator: getAddress(
      VIU_BLOCKCHAIN_TEST_CONFIG.operatorAddress,
    ),

    metadataHash,

    tokenUri,
    tokenUriSource,

    expectedTokenId,

    canonicalMetadataHashMatches: true,
  };
}

export async function simulatePreparedBlockchainMint(
  payload: PreparedViuMintPayload,
): Promise<SimulatedBlockchainMint> {
  const prepared =
    prepareBlockchainMint(payload);

  const contractTokenId =
    await publicClient.readContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi: ICHTHION_VIU_ABI,

      functionName: "computeTokenId",

      args: [prepared.futureTokenId],
    });

  if (
    contractTokenId !== prepared.expectedTokenId
  ) {
    throw new Error(
      "Adapter tokenId does not match smart-contract tokenId.",
    );
  }

  const simulation =
    await publicClient.simulateContract({
      address:
        VIU_BLOCKCHAIN_TEST_CONFIG.contractAddress,

      abi: ICHTHION_VIU_ABI,

      functionName: "mintVIU",

      account: prepared.operator,

      args: [
        prepared.recipient,
        prepared.futureTokenId,
        prepared.metadataHash,
        prepared.tokenUri,
      ],
    });

  const simulatedTokenId = simulation.result;

  if (
    simulatedTokenId !== prepared.expectedTokenId
  ) {
    throw new Error(
      "Simulated mint returned an unexpected tokenId.",
    );
  }

  return {
    ...prepared,

    contractTokenId,
    simulatedTokenId,

    simulationPassed: true,
  };
}