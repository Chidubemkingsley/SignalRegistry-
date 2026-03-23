import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.20",

  networks: {
    rskTestnet: {
      url: process.env.ALCHEMY_RSK_URL || "https://public-node.testnet.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31
    }
  },

  etherscan: {
    apiKey: {
      rskTestnet: "unused"
    },
    customChains: [
      {
        network: "rskTestnet",
        chainId: 31,
        urls: {
          apiURL: "https://rootstock-testnet.blockscout.com/api",
          browserURL: "https://rootstock-testnet.blockscout.com"
        }
      }
    ]
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  }
};

export default config;