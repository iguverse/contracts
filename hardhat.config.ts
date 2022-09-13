import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-docgen";
import "hardhat-gas-reporter";
import "hardhat-interface-generator";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

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
    ],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          process.env.MNEMONIC !== undefined ? process.env.MNEMONIC : "",
      },
    },
    bsctestnet: {
      url: process.env.BSCTESTNET_URL || "",
      chainId: 97,
      accounts: {
        mnemonic:
          process.env.MNEMONIC !== undefined ? process.env.MNEMONIC : "",
      },
    },
    bscmainnet: {
      url: process.env.BSCMAINNET_URL || "",
      chainId: 56,
      accounts: {
        mnemonic:
          process.env.MNEMONIC !== undefined ? process.env.MNEMONIC : "",
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    // gasPrice: 100,
    token: "BNB",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY,
      bscMainnet: process.env.BSCSCAN_API_KEY,
    },
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
  },
};

export default config;
