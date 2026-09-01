export const ICHTHION_VIU_ABI = [
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
    name: "mintVIU",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "recipient",
        type: "address",
      },
      {
        name: "viuId",
        type: "string",
      },
      {
        name: "metadataHash",
        type: "bytes32",
      },
      {
        name: "uri",
        type: "string",
      },
    ],
    outputs: [
      {
        name: "tokenId",
        type: "uint256",
      },
    ],
  },
] as const;