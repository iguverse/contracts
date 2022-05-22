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

  // tBUSD
  const BusdArtifact = await ethers.getContractFactory("tBUSD");
  const tbusd = await BusdArtifact.deploy();
  await tbusd.deployed();
  console.log("BUSD deployed to:", tbusd.address);

  // Crowdsale
  const CrowdsaleDepositArtifact = await ethers.getContractFactory(
    "CrowdsaleDeposit"
  );
  const crowdsale = await CrowdsaleDepositArtifact.deploy(tbusd.address, false);
  await crowdsale.deployed();
  console.log("Crowdsale deployed to:", crowdsale.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
