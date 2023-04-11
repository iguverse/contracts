import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getDeployedContract } from "../../helpers/utils";
import { Contract } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { zero, treasury, signer } = await getNamedAccounts();

  if (chainId === "97" && process.env.SIGNER_ADDRESS_TESTNET) {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
  }
  if (chainId === "56") {
    signer = process.env.SIGNER_ADDRESS_MAINNET ? process.env.SIGNER_ADDRESS_MAINNET : signer;
    treasury = process.env.TREASURY_ADDRESS_MAINNET ? process.env.TREASURY_ADDRESS_MAINNET : treasury;
  }

  const iguToken: Contract = await getDeployedContract("IguToken");

  await deploy("IguWallet", {
    from: zero,
    args: [iguToken.address, signer, treasury],
    log: true,
  });
};
export default func;
func.tags = ["IgupBooster", "IgupToken"];
