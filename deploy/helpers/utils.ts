import * as hre from "hardhat";
import { ethers } from "hardhat";
import { Contract } from "ethers";

export async function getDeployedContract(contractName: string): Promise<any> {
  const deployment = await hre.deployments.get(contractName);
  const contract: Contract = await ethers.getContractAt(
    contractName,
    deployment.address
  );
  return contract;
}

export default { getDeployedContract };
