import {
  createPublicClient,
  http,
  parseEventLogs,
  type Address,
  type Hex,
} from "viem";

import { baseSepolia } from "viem/chains";

const CONTRACT =
  "0xD45AF8e330f799FcC8E91C463fdF87CDaa89dbaE" as Address;

const TX_HASH =
  "0x3b4b4a1f41934c9339332e2de1b588bb526ed08ec061818edccd0e450e4227e2" as Hex;

const VIU_ID = "VIU-202608-000025";

const ABI = [
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        name: "tokenId",
        type: "uint256",
      },
    ],
  },

  {
    type: "event",
    name: "VIUMinted",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        name: "viuId",
        type: "string",
      },
      {
        indexed: true,
        name: "metadataHash",
        type: "bytes32",
      },
      {
        indexed: true,
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        name: "tokenURI",
        type: "string",
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
  console.log("=== Inspect First VIU Mint Transaction ===");
  console.log("");

  const tx = await client.getTransaction({
    hash: TX_HASH,
  });

  const receipt =
    await client.getTransactionReceipt({
      hash: TX_HASH,
    });

  console.log(`TX: ${TX_HASH}`);
  console.log(`To: ${tx.to}`);
  console.log(`Status: ${receipt.status}`);
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Logs: ${receipt.logs.length}`);

  const events = parseEventLogs({
    abi: ABI,
    logs: receipt.logs,
    strict: false,
  });

  console.log("");
  console.log("=== Decoded Events ===");

  for (const event of events) {
    console.log("");
    console.log(`Event: ${event.eventName}`);

    console.log(
      JSON.stringify(
        event.args,
        (_, value) =>
          typeof value === "bigint"
            ? value.toString()
            : value,
        2,
      ),
    );
  }

  const expectedTokenId =
    await client.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "computeTokenId",
      args: [VIU_ID],
    });

  console.log("");
  console.log(
    `Expected token ID: ${expectedTokenId}`,
  );

  const mintedEvent = events.find(
    (event) => event.eventName === "VIUMinted",
  );

  if (!mintedEvent) {
    throw new Error(
      "No VIUMinted event found in the successful transaction.",
    );
  }

  const eventTokenId =
    mintedEvent.args.tokenId;

  console.log(
    `VIUMinted event token ID: ${eventTokenId}`,
  );

  console.log(
    `Token IDs match: ${
      eventTokenId === expectedTokenId
    }`,
  );

  const ownerAtMintBlock =
    await client.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "ownerOf",
      args: [eventTokenId],
      blockNumber: receipt.blockNumber,
    });

  console.log(
    `Owner at mint block: ${ownerAtMintBlock}`,
  );

  const ownerNow =
    await client.readContract({
      address: CONTRACT,
      abi: ABI,
      functionName: "ownerOf",
      args: [eventTokenId],
    });

  console.log(`Owner now: ${ownerNow}`);

  console.log("");
  console.log("PASS: Mint transaction inspected.");
}

main().catch((error) => {
  console.error("");
  console.error("FAIL: Inspection failed.");
  console.error(error);
  process.exitCode = 1;
});