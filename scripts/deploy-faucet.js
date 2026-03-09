const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

function getUsdcAddress() {
  const addr = process.env.USDC_ADDRESS || "";
  if (!ethers.utils.isAddress(addr)) {
    throw new Error("USDC_ADDRESS env is missing or invalid");
  }
  return addr;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdcAddress = getUsdcAddress();

  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("USDC:", usdcAddress);

  const Faucet = await ethers.getContractFactory("USDCFaucet");
  const faucet = await Faucet.deploy(usdcAddress);
  await faucet.deployed();
  const faucetAddress = faucet.address;

  console.log("USDCFaucet:", faucetAddress);

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deployment = {
    network: network.name,
    chainId,
    usdcAddress,
    faucetAddress,
    claimAmount: "10000",
    decimals: 6,
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2), "utf8");
  console.log("Deployment file written:", deploymentPath);

  const frontendConfigPath = path.join(__dirname, "..", "frontend", "config.js");
  fs.writeFileSync(frontendConfigPath, `window.FAUCET_ADDRESS = "${faucetAddress}";\n`, "utf8");
  console.log("Frontend config written:", frontendConfigPath);

  console.log("IMPORTANT: Fund faucet with USDC before first claim.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
