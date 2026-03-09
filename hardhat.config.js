require("@nomiclabs/hardhat-ethers");

const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC || "";

const accounts = DEPLOYER_MNEMONIC ? { mnemonic: DEPLOYER_MNEMONIC } : undefined;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts,
    },
  },
};
