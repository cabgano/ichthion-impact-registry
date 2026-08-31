import { network } from "hardhat";
import { formatEther } from "viem";

async function main() {
  const { viem } = await network.connect("baseSepolia");

  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();

  const walletClient = walletClients[0];

  if (!walletClient) {
    throw new Error("No wallet client found for Base Sepolia.");
  }

  const chainId = await publicClient.getChainId();

  const balance = await publicClient.getBalance({
    address: walletClient.account.address,
  });

  console.log("=== Ichthion Blockchain Test Connection ===");
  console.log(`Network: Base Sepolia`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Wallet: ${walletClient.account.address}`);
  console.log(`Balance: ${formatEther(balance)} ETH`);

  if (chainId !== 84532) {
    throw new Error(
      `Unexpected chain ID. Expected 84532, received ${chainId}.`
    );
  }

  console.log("");
  console.log("PASS: Hardhat is connected to Base Sepolia.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});