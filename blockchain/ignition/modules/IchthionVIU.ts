import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IchthionVIUModule", (m) => {
  // Account 0 is the wallet configured for the selected Hardhat network.
  // On Base Sepolia this will be the dedicated Ichthion 11A test wallet.
  const admin = m.getAccount(0);

  // The constructor receives the initial admin address.
  // That address receives:
  // - DEFAULT_ADMIN_ROLE
  // - MINTER_ROLE
  // - TRANSFER_ROLE
  const viu = m.contract("IchthionVIU", [admin]);

  return { viu };
});