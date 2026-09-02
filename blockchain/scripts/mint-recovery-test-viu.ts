import { network } from "hardhat";
import type { Address, Hex } from "viem";

const CONTRACT_ADDRESS =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const VIU_ID =
  "VIU-202608-000019";

const METADATA_HASH =
  "0xb37896be6aa8c65c98d598feed7c8d8fb42dfc604401f9ea61fd38222f198b8f" as Hex;

const TOKEN_URI =
  "https://pdnljxidekikjnjnfoqh.supabase.co/storage/v1/object/public/viu-onchain-metadata/sha256/b37896be6aa8c65c98d598feed7c8d8fb42dfc604401f9ea61fd38222f198b8f.json";

const ABI = [
  {
    type: "function",
    name: "mintVIU",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "viuId", type: "string" },
      { name: "metadataHash", type: "bytes32" },
      { name: "uri", type: "string" },
    ],
    outputs: [
      { name: "tokenId", type: "uint256" },
    ],
  },

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

async function main() {
  const { viem } =
    await network.connect("baseSepolia");

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

  const operator =
    walletClient.account.address;

  console.log("");
  console.log(
    "=== Ichthion First Registry VIU Testnet Mint ===",
  );
  console.log("");

  console.log("Network: Base Sepolia");

  const chainId =
    await publicClient.getChainId();

  console.log(`Chain ID: ${chainId}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Operator: ${operator}`);

  console.log("");
  console.log(`VIU: ${VIU_ID}`);
  console.log(`Metadata hash: ${METADATA_HASH}`);
  console.log(`Token URI: ${TOKEN_URI}`);

  if (chainId !== 84532) {
    throw new Error(
      `Unexpected chain ID: ${chainId}`,
    );
  }

  const expectedTokenId =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "computeTokenId",
      args: [VIU_ID],
    });

  console.log("");
  console.log(
    `Expected token ID: ${expectedTokenId}`,
  );

  console.log("");
  console.log(
    "Sending REAL Base Sepolia mint transaction...",
  );

  const txHash =
    await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "mintVIU",
      args: [
        operator,
        VIU_ID,
        METADATA_HASH,
        TOKEN_URI,
      ],
      chain: walletClient.chain,
      account: walletClient.account,
    });

  console.log("");
  console.log(`Transaction hash: ${txHash}`);
  console.log("");
  console.log(
    "Waiting for transaction receipt...",
  );

  const receipt =
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

  console.log(
    `Receipt status: ${receipt.status}`,
  );

  console.log(
    `Block number: ${receipt.blockNumber}`,
  );

  if (receipt.status !== "success") {
    throw new Error(
      `Mint transaction failed: ${txHash}`,
    );
  }

  const owner =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "ownerOf",
      args: [expectedTokenId],
    });

  const tokenUri =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "tokenURI",
      args: [expectedTokenId],
    });

  const metadataHash =
    await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "metadataHashOf",
      args: [expectedTokenId],
    });

  console.log("");
  console.log("=== On-Chain Verification ===");
  console.log("");

  console.log(`Token ID: ${expectedTokenId}`);
  console.log(`Owner: ${owner}`);
  console.log(`Token URI: ${tokenUri}`);
  console.log(
    `Metadata hash: ${metadataHash}`,
  );

  if (
    owner.toLowerCase() !==
    operator.toLowerCase()
  ) {
    throw new Error(
      "On-chain owner does not match the expected Ichthion test wallet.",
    );
  }

  if (tokenUri !== TOKEN_URI) {
    throw new Error(
      "On-chain token URI does not match the canonical URI.",
    );
  }

  if (
    metadataHash.toLowerCase() !==
    METADATA_HASH.toLowerCase()
  ) {
    throw new Error(
      "On-chain metadata hash does not match the Registry metadata hash.",
    );
  }

  console.log("");
  console.log(
    "PASS: First Registry VIU minted and verified on Base Sepolia.",
  );

  console.log("");
  console.log("RESULT");
  console.log(`tx_hash=${txHash}`);
  console.log(`token_id=${expectedTokenId}`);
  console.log(`wallet_address=${owner}`);
  console.log(`token_uri=${tokenUri}`);
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: First Registry VIU mint failed.",
  );

  console.error(error);

  process.exitCode = 1;
});
