import * as hre from "hardhat";
import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function deployAndVerify(
  contractName: string,
  args?: any[],
  verify?: boolean
): Promise<Contract> {
  console.log("==================================");
  console.log("Deploying " + contractName + " ...");
  const ContractArtifact = await ethers.getContractFactory(contractName);
  let contract;
  if (args && args.length > 0) {
    contract = await ContractArtifact.deploy(...args);
  } else {
    contract = await ContractArtifact.deploy();
  }
  await contract.deployed();
  console.log(contractName + " deployed to:", contract.address);

  if (verify && verify === true) {
    try {
      console.log("Verifying contract " + contract.address);
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: args,
      });
    } catch (err: { message: string } | any) {
      if (err.message && err.message.includes("Reason: Already Verified")) {
        console.log("Contract is already verified!");
      } else {
        console.log(err);
      }
    }
  }
  return contract;
}
