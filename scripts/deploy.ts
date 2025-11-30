import { ethers } from "hardhat";

/*
 * Deployment script for ConfidentialLending. 
 */

async function main() {
  const threshold = 1000;
  const ConfidentialLending = await ethers.getContractFactory("ConfidentialLending");
  const contract = await ConfidentialLending.deploy(threshold);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`ConfidentialLending deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

