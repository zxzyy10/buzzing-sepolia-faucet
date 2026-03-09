const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  const mockUSDCAddress = mockUSDC.address;
  console.log("MockUSDC:", mockUSDCAddress);

  const Faucet = await ethers.getContractFactory("USDCFaucet");
  const faucet = await Faucet.deploy(mockUSDCAddress);
  await faucet.deployed();
  const faucetAddress = faucet.address;
  console.log("USDCFaucet:", faucetAddress);

  const mintAmount = ethers.utils.parseUnits("1000000", 6);
  const tx = await mockUSDC.mint(faucetAddress, mintAmount);
  await tx.wait();

  const faucetBalance = await faucet.faucetBalance();
  console.log("Faucet funded:", ethers.utils.formatUnits(faucetBalance, 6), "USDC");

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const deployment = {
    network: network.name,
    chainId,
    usdcAddress: mockUSDCAddress,
    faucetAddress,
    claimAmount: "10000",
    decimals: 6
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2), "utf8");
  console.log("Deployment file written:", deploymentPath);

  const frontendConfigPath = path.join(__dirname, "..", "frontend", "config.js");
  fs.writeFileSync(frontendConfigPath, `window.FAUCET_ADDRESS = "${faucetAddress}";\n`, "utf8");
  console.log("Frontend config written:", frontendConfigPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
