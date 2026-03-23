import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SignalRegistryModule = buildModule("SignalRegistryModule", (m) => {
  // This replaces ethers.getContractFactory and contract.deploy()
  const signalRegistry = m.contract("SignalRegistry", []);

  // If you need to call a function immediately after deployment (like your Counter example):
  // m.call(signalRegistry, "someFunction", [args]);

  return { signalRegistry };
});

export default SignalRegistryModule;
