import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { getDeployedContract } from "../../helpers/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { deployer, signer } = await getNamedAccounts();

  if (chainId === "97" && process.env.SIGNER_ADDRESS_TESTNET) {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
  }
  if (chainId === "56" && process.env.SIGNER_ADDRESS_TESTNET) {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
  }

  const iguToken: Contract = await getDeployedContract("IguToken");

  await deploy("IguBooster", {
    from: deployer,
    args: [iguToken.address, signer],
    log: true,
  });
};
export default func;
func.tags = ["IguBooster", "IguToken"];
