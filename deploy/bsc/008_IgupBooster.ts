import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { getDeployedContract } from "../../helpers/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { mainDeployer, signer } = await getNamedAccounts();

  console.log(mainDeployer);

  if (chainId === "97" && process.env.SIGNER_ADDRESS_TESTNET) {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
  }
  if (chainId === "56" && process.env.SIGNER_ADDRESS_MAINNET) {
    signer = process.env.SIGNER_ADDRESS_MAINNET;
  }

  const igupToken: Contract = await getDeployedContract("IgupToken");

  await deploy("IgupBooster", {
    from: mainDeployer,
    args: [igupToken.address, signer],
    log: true,
  });
};
export default func;
func.tags = ["IgupBooster", "IgupToken"];
