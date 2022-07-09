import { ethers } from "hardhat";

const addresses = [
  "0x4A6c62FeF99642171341dD8419Ed98173cae6412", // Mariusz
  "0xBE6f9f49dcFf494034d4295B569CE7baF8cE9B0F", // Bogdan
];

const settings = {
  signer: "0x86CE95c13Ee05Bdc8CDebb781E33E7d755E2c3FE",
};

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

  // Iguverse NFT
  const IguverseArtifact = await ethers.getContractFactory("Iguverse");
  const iguverse = await IguverseArtifact.deploy(
    "Iguverse NFT",
    "IGU",
    "https://backend.stage.igumetinfra.net/nft/",
    settings.signer
  );
  await iguverse.deployed();
  console.log("Iguverse NFT deployed to:", iguverse.address);

  // Transfering tokens
  console.log("Starting transfer");
  for (let i = 0; i < addresses.length; i++) {
    await govtoken.transfer(addresses[i], ethers.utils.parseEther("100000"));
    await tbusd.transfer(addresses[i], ethers.utils.parseEther("100000"));
  }
  console.log("Transfers completed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
