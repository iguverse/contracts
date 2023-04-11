import {
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts/src.ts/index";
import { Network } from "@ethersproject/networks";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IguToken, LootBox } from "../typechain-types";
import { deployContract, txExec } from "./helpers/utils";

const testnetValues = {
  vrfCordinator: "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
  keyHash: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
  subscriptionId: 1967,
};

describe("LootBox", function () {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  let iguToken: IguToken;
  let lootBox: LootBox;

  let network: Network;

  beforeEach(async () => {
    [owner, signer, bob, alice] = await ethers.getSigners();
    network = await ethers.provider.getNetwork();

    iguToken = await deployContract("IguToken");
    lootBox = await deployContract(
      "LootBox",
      "Iguverse LootBox",
      "ILB",
      "https://metadata.com/",
      signer.address,
      testnetValues.vrfCordinator,
      testnetValues.keyHash,
      testnetValues.subscriptionId
    );

    await iguToken
      .connect(owner)
      .transfer(bob.address, ethers.utils.parseEther("100"));

    await iguToken
      .connect(bob)
      .approve(lootBox.address, ethers.utils.parseEther("1"));
  });

  describe("Signatures", () => {
    let tx: ContractTransaction;
    let recipt: ContractReceipt;

    beforeEach(async () => {
      const domainData = {
        name: "Iguverse",
        version: "1",
        chainId: network.chainId,
        verifyingContract: lootBox.address,
      };

      const types = {
        RequestToken: [
          { name: "mintReceiver", type: "address" },
          { name: "tokensToMint", type: "uint256" },
          { name: "ptFromAccount", type: "address" },
          { name: "ptFromAccountReceivers", type: "address[]" },
          { name: "fromAccountAmounts", type: "uint256[]" },
          { name: "executor", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        mintReceiver: bob.address,
        tokensToMint: 1,
        ptFromAccount: iguToken.address,
        ptFromAccountReceivers: [lootBox.address],
        fromAccountAmounts: [ethers.utils.parseEther("1")],
        executor: bob.address,
        nonce: 1,
        deadline: 1000000000000,
      };

      const signature = await signer._signTypedData(domainData, types, value);

      [tx, recipt] = await txExec(
        lootBox
          .connect(bob)
          .getToken(
            value.mintReceiver,
            value.tokensToMint,
            value.ptFromAccount,
            value.ptFromAccountReceivers,
            value.fromAccountAmounts,
            value.nonce,
            value.deadline,
            signature
          )
      );
    });

    it("Should emit IguToken Transfer event", async () => {
      await expect(tx)
        .to.emit(iguToken, "Transfer")
        .withArgs(bob.address, lootBox.address, ethers.utils.parseEther("1"));
    });

    it("Should mint LootBox token", async () => {
      await expect(tx)
        .to.emit(lootBox, "Transfer")
        .withArgs(ethers.constants.AddressZero, bob.address, "0");
    });
  });

  /* TODO: add mock response
  describe("Signatures Redeem", () => {
    let tx: ContractTransaction;
    let recipt: ContractReceipt;

    beforeEach(async () => {
      await lootBox.safeMint(bob.address, 1);

      const domainData = {
        name: "Iguverse",
        version: "1",
        chainId: network.chainId,
        verifyingContract: lootBox.address,
      };

      const types = {
        RequestRandom: [
          { name: "tokenId", type: "uint256" },
          { name: "minNum", type: "uint256" },
          { name: "maxNum", type: "uint256" },
          { name: "ptFromAccount", type: "address" },
          { name: "ptFromAccountReceivers", type: "address[]" },
          { name: "fromAccountAmounts", type: "uint256[]" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        tokenId: 0,
        minNum: 1,
        maxNum: 10,
        ptFromAccount: ethers.constants.AddressZero,
        ptFromAccountReceivers: [],
        fromAccountAmounts: [],
        deadline: 1000000000000,
      };

      const signature = await signer._signTypedData(domainData, types, value);

      [tx, recipt] = await txExec(
        lootBox
          .connect(bob)
          .requestRandomForToken(
            value.tokenId,
            value.minNum,
            value.maxNum,
            value.ptFromAccount,
            value.ptFromAccountReceivers,
            value.fromAccountAmounts,
            value.deadline,
            signature
          )
      );
    });

    it("Should emit request token", async () => {
      await expect(tx).to.emit(lootBox, "NumberRequested");
    });
  });
  */
});
