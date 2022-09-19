import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  let { deployer } = await getNamedAccounts();

  await deploy("IguToken", {
    from: deployer,
    args: [],
    log: true,
  });
};
export default func;
func.tags = ["IguToken"];
