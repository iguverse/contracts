import { ethers } from "hardhat";
import { deployAndVerify } from "./helpers/utils";

async function main() {
  const signer = await ethers.provider.getSigner().getAddress();

  // Igu Token
  const iguToken = await deployAndVerify("IguToken", [], false);

  // Vesting
  await deployAndVerify("IguVesting", [iguToken.address], false);

  // tBUSD
  await deployAndVerify("tBUSD", [], false);

  // Iguverse NFT
  const iguverseNFTParams = [
    "Iguverse NFT",
    "IGU",
    "https://backend.stage.igumetinfra.net/nft/",
    signer,
  ];
  await deployAndVerify("Iguverse", iguverseNFTParams, false);

  // Distributor
  const distributorParams = [signer, iguToken.address];
  await deployAndVerify("TokenDistributor", distributorParams, false);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
