import { ethers } from "hardhat";
import { deployAndVerify } from "./helpers/utils";

const addresses = [
  "0x4A6c62FeF99642171341dD8419Ed98173cae6412", // Mariusz
  "0xBE6f9f49dcFf494034d4295B569CE7baF8cE9B0F", // Bogdan
];

const settings = {
  signer: "0x86CE95c13Ee05Bdc8CDebb781E33E7d755E2c3FE",
};

async function main() {
  // Igu Token
  const iguToken = await deployAndVerify("IguToken", [], true);

  // Vesting
  await deployAndVerify("IguVesting", [iguToken.address], true);

  // tBUSD
  const tbusd = await deployAndVerify("tBUSD", [], true);

  // Iguverse NFT
  const iguverseNFTParams = [
    "Iguverse NFT",
    "IGU",
    "https://backend.stage.igumetinfra.net/nft/",
    settings.signer,
  ];
  await deployAndVerify("Iguverse", iguverseNFTParams, true);

  // Distributor
  const distributorParams = [settings.signer, iguToken.address];
  await deployAndVerify("TokenDistributor", distributorParams, true);

  // Transfering tokens
  console.log("Starting transfer");
  for (let i = 0; i < addresses.length; i++) {
    await iguToken.transfer(addresses[i], ethers.utils.parseEther("100000"));
    await tbusd.transfer(addresses[i], ethers.utils.parseEther("100000"));
  }
  console.log("Transfers completed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
