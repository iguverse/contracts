import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { deployer, signer } = await getNamedAccounts();
  let uriUrl = process.env.URL_LOCAL;

  if (chainId === "97") {
    signer = process.env.SIGNER_ADDRESS_TESTNET;
    uriUrl = process.env.URL_TESTNET;
  }
  if (chainId === "56") {
    signer = process.env.SIGNER_ADDRESS_MAINNET;
    uriUrl = process.env.URL_MAINNET;
  }

  const params = ["Iguverse NFT", "IGU", uriUrl + "nft/", signer];

  await deploy("Iguverse", {
    from: deployer,
    args: params,
    log: true,
  });
};
export default func;
func.tags = ["Iguverse"];
