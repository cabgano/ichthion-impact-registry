import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  http,
  type Address,
} from "viem";

import { baseSepolia } from "viem/chains";

const CONTRACT =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const VIU_ID = "VIU-202608-000019";

const ABI = [
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
] as const;

async function main() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  console.log("");
  console.log(
    "=== Ichthion VIU Token Existence Preflight ===",
  );
  console.log("");

  const tokenId = await client.readContract({
    address: CONTRACT,
    abi: ABI,
    functionName: "computeTokenId",
    args: [VIU_ID],
  });

  console.log(`VIU: ${VIU_ID}`);
  console.log(`Deterministic token ID: ${tokenId}`);
  console.log("");

  try {
    const owner = await client.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });

    console.log(`Existing owner: ${owner}`);

    throw new Error(
      "FAIL: VIU already exists on-chain. Do not mint.",
    );
  } catch (error) {
    if (error instanceof BaseError) {
      const revertError = error.walk(
        (entry) =>
          entry instanceof ContractFunctionRevertedError,
      );

      if (
        revertError instanceof ContractFunctionRevertedError &&
        revertError.data?.errorName ===
          "ERC721NonexistentToken"
      ) {
        console.log(
          "PASS: Token does not exist on-chain.",
        );

        console.log(
          "Safe to proceed with controlled recovery-test mint.",
        );

        return;
      }
    }

    throw error;
  }
}

main().catch((error) => {
  console.error("");
  console.error("FAIL: Token existence preflight failed.");
  console.error(error);
  process.exitCode = 1;
});