import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { getDeployedContract } from "../../helpers/utils";
import { Contract } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const chainId = await getChainId();

  let { deployer, signer } = await getNamedAccounts();
  let uriUrl = process.env.URL_LOCAL;
  let vrfCordinator = ethers.constants.AddressZero;
  let keyHash = ethers.constants.HashZero;
  let subscriptionId = 0;

  if (chainId === "97") {
    signer = process.env.SIGNER_ADDRESS_TESTNET ? process.env.SIGNER_ADDRESS_TESTNET : signer;
    uriUrl = process.env.URL_TESTNET;
    vrfCordinator = "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f";
    keyHash =
      "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314";
    subscriptionId = 1967;
  }
  if (chainId === "56") {
    signer = process.env.SIGNER_ADDRESS_MAINNET ? process.env.SIGNER_ADDRESS_MAINNET : signer;
    uriUrl = process.env.URL_MAINNET;
    vrfCordinator = "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE";
    keyHash =
      "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04";
    subscriptionId = 611;
  }

  const params = [
    "Iguverse LootBox",
    "ILB",
    uriUrl + "lootbox/nft/",
    signer,
    vrfCordinator,
    keyHash,
    subscriptionId,
  ];

  await deploy("LootBox", {
    from: deployer,
    args: params,
    log: true,
  });
};
export default func;
func.tags = ["LootBox"];
