import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { getDeployedContract } from "../helpers/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { deployer, signer } = await getNamedAccounts();

  if (chainId === "97") {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
  }
  if (chainId === "56") {
    signer = process.env.SIGNER_ADDRESS_MAINNET;
  }

  const igupToken: Contract = await getDeployedContract("IgupToken");

  await deploy("TokenDistributor", {
    from: deployer,
    args: [signer, igupToken.address],
    log: true,
  });
};
export default func;
func.tags = ["TokenDistributor", "IgupToken"];
