import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { getDeployedContract } from "../helpers/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  let { deployer } = await getNamedAccounts();

  const iguToken: Contract = await getDeployedContract("IguToken");

  await deploy("IguVesting", {
    from: deployer,
    args: [iguToken.address],
    log: true,
  });
};
export default func;
func.tags = ["IguVesting"];
