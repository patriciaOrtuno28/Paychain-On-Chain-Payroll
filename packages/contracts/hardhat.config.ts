import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "dotenv/config";

import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";

// Keep MNEMONIC for hardhat/local
const MNEMONIC = vars.get(
  "MNEMONIC",
  "test test test test test test test test test test test junk"
);

// Read from .env (preferred for Sepolia)
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://sepolia.infura.io/v3/REPLACE_ME";

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: { deployer: 0 },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? vars.get("ETHERSCAN_API_KEY", "")
    }
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false
  },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    deploy: "./deploy",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: { bytecodeHash: "none" },
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun"
    }
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6"
  }
};

export default config;
