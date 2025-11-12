require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
      // Hardhat node provides accounts automatically
    },
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC || "https://data-seed-prebsc-2-s1.binance.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
      timeout: 60000,
    },
    bnbMainnet: {
      url: process.env.BNB_MAINNET_RPC || "https://bsc-dataseed.binance.org/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 56,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

