import { ethers } from "hardhat";

async function main() {
  // Gov Token
  const GovTokenArtifact = await ethers.getContractFactory("GovToken");
  const govtoken = await GovTokenArtifact.deploy();
  await govtoken.deployed();
  console.log("GovToken deployed to:", govtoken.address);

  // Vesting
  const VestingArtifact = await ethers.getContractFactory("GovVesting");
  const vesting = await VestingArtifact.deploy(govtoken.address);
  await vesting.deployed();
  console.log("Vesting deployed to:", vesting.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
