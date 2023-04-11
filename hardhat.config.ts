import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-contract-sizer";
import "hardhat-docgen";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-solhint";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 15,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
    ],
  },
  namedAccounts: {
    zero: 0,
    deployer: 0,
    signer: 2,
    treasury: 0,
  },
  networks: {
    bsctestnet: {
      url: process.env.BSCTESTNET_URL || "",
      chainId: 97,
      accounts: [
        process.env.OWNER_PRIVATE_KEY ? process.env.OWNER_PRIVATE_KEY : "",
      ],
      saveDeployments: true,
      deploy: ["deploy/bsc/"],
    },
    bsc: {
      url: process.env.BSCMAINNET_URL || "",
      chainId: 56,
      accounts: [
        process.env.OWNER_PRIVATE_KEY ? process.env.OWNER_PRIVATE_KEY : "",
      ],
      saveDeployments: true,
      deploy: ["deploy/bsc/"],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 5,
    token: "BNB",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      bsctestnet: process.env.BSCSCAN_API_KEY
        ? process.env.BSCSCAN_API_KEY
        : "",
      bsc: process.env.BSCSCAN_API_KEY ? process.env.BSCSCAN_API_KEY : "",
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.BSCSCAN_API_KEY,
    },
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
