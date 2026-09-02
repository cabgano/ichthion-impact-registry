import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  http,
  type Address,
  type Hex,
} from "viem";

import { baseSepolia } from "viem/chains";

const CONTRACT =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const OPERATOR =
  "0x3d54de9023a7dea18f8974809cbd650d3ceaf3be" as Address;

const VIU_ID = "VIU-202608-000025";

const TOKEN_ID = BigInt(
  "72732562318524929266075173730277389934748422802787302168657984849019553907476",
);

const METADATA_HASH =
  "0x280f07855658df2600eaf84b171486cb5c6cc78d4f52bce07b262b8ad279502d" as Hex;

const TOKEN_URI =
  "https://pdnljxidekikjnjnfoqh.supabase.co/storage/v1/object/public/viu-onchain-metadata/sha256/280f07855658df2600eaf84b171486cb5c6cc78d4f52bce07b262b8ad279502d.json";

const ABI = [
  {
    type: "error",
    name: "VIUAlreadyMinted",
    inputs: [
      { name: "viuId", type: "string" },
      { name: "tokenId", type: "uint256" },
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
] as const;

async function main() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  console.log("");
  console.log(
    "=== Ichthion Duplicate VIU Mint Protection Test ===",
  );
  console.log("");

  const owner = await client.readContract({
    address: CONTRACT,
    abi: ABI,
    functionName: "ownerOf",
    args: [TOKEN_ID],
  });

  console.log(`Existing VIU: ${VIU_ID}`);
  console.log(`Existing token ID: ${TOKEN_ID}`);
  console.log(`Current owner: ${owner}`);

  if (owner.toLowerCase() !== OPERATOR.toLowerCase()) {
    throw new Error(
      "Existing token owner does not match expected owner.",
    );
  }

  console.log("");
  console.log(
    "Simulating duplicate mint. No transaction will be sent...",
  );

  try {
    await client.simulateContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "mintVIU",
      account: OPERATOR,
      args: [
        OPERATOR,
        VIU_ID,
        METADATA_HASH,
        TOKEN_URI,
      ],
    });

    throw new Error(
      "FAIL: duplicate mint simulation unexpectedly succeeded.",
    );
  } catch (error) {
    if (error instanceof BaseError) {
      const revertError = error.walk(
        (entry) =>
          entry instanceof ContractFunctionRevertedError,
      );

      if (
        revertError instanceof ContractFunctionRevertedError &&
        revertError.data?.errorName === "VIUAlreadyMinted"
      ) {
        console.log("");
        console.log(
          "Expected contract error: VIUAlreadyMinted",
        );

        console.log("");
        console.log(
          "PASS: Smart contract blocks duplicate VIU mint.",
        );

        return;
      }
    }

    throw error;
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "FAIL: Duplicate mint protection test failed.",
  );
  console.error(error);
  process.exitCode = 1;
});