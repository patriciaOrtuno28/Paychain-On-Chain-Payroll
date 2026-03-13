import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

function isLocalNetwork(name: string) {
  return name === "hardhat" || name === "localhost";
}

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;
  const networkName = hre.network.name;

  let underlyingAddress: string;

  // 1) Resolve/deploy underlying ERC20
  if (isLocalNetwork(networkName)) {
    // Requires a local mintable MockERC20 contract in your repo (recommended)
    const underlying = await deploy("MockERC20", {
      from: deployer,
      log: true,
      contract: "contracts/mocks/MockERC20.sol:MockERC20",
      args: ["Mock USD", "mUSD", 6] // if your mock constructor supports decimals
    });

    underlyingAddress = underlying.address;
    log(`Using local underlying ERC20 (MockERC20): ${underlyingAddress}`);
  } else {
    const envUnderlying = process.env.PAYROLL_UNDERLYING_ERC20;
    if (!envUnderlying) {
      throw new Error(
        `Missing PAYROLL_UNDERLYING_ERC20 for network "${networkName}". ` +
          `Set it to the ERC20 address you want to wrap (e.g. Sepolia USDC/EURC).`
      );
    }
    underlyingAddress = envUnderlying;
    log(`Using external underlying ERC20 from env: ${underlyingAddress}`);
  }

  // 2) Deploy the shared confidential wrapper (platform shared)
  const wrapper = await deploy("PayrollConfidentialWrapper", {
    from: deployer,
    log: true,
    contract: "contracts/PayrollConfidentialWrapper.sol:PayrollConfidentialWrapper",
    args: [
      underlyingAddress,
      "Confidential Payroll USD",
      "cpUSD",
      "ipfs://payroll-conf-wrapper"
    ]
  });

  // 3) Deploy the shared registry/factory and point it to the wrapper (IERC7984-compatible)
  await deploy("PayrollFactoryRegistry", {
    from: deployer,
    log: true,
    contract: "contracts/PayrollFactoryRegistry.sol:PayrollFactoryRegistry",
    args: [wrapper.address]
  });

  // NOTE:
  // We DO NOT deploy Payroll here.
  // Each employer gets their own Payroll later via:
  // PayrollFactoryRegistry.registerCompany(companyName)
};

export default func;
func.id = "deploy_payroll_platform";
func.tags = ["PayrollPlatform", "PayrollConfidentialWrapper", "PayrollFactoryRegistry"];