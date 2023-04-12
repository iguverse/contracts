import {
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts/src.ts/index";
import { Network } from "@ethersproject/networks";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IguToken, IguWallet, Iguverse } from "../typechain-types";
import { deployContract, txExec } from "./helpers/utils";

describe("Iguverse", function () {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  let iguToken: IguToken;
  let iguWallet: IguWallet;

  let network: Network;

  beforeEach(async () => {
    [owner, signer, bob, alice] = await ethers.getSigners();
    network = await ethers.provider.getNetwork();

    iguToken = await deployContract("IguToken");
    iguWallet = await deployContract(
      "IguWallet",
      iguToken.address,
      owner.address,
      owner.address
    );

    await iguToken
      .connect(owner)
      .approve(iguWallet.address, ethers.utils.parseEther("100"));

    await iguWallet.deposit(ethers.utils.parseEther("100"));
  });

  describe("Signatures", () => {
    let tx: ContractTransaction;
    let recipt: ContractReceipt;
    let balanceBefore: BigNumber;

    beforeEach(async () => {
      const domainData = {
        name: "Iguverse",
        version: "1",
        chainId: network.chainId,
        verifyingContract: iguWallet.address,
      };

      const types = {
        WithdrawData: [
          { name: "walletAddress", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        walletAddress: owner.address,
        amount: ethers.utils.parseEther("50"),
        fee: ethers.utils.parseEther("10"),
        nonce: "123",
        deadline: "1000000000000"
      };

      balanceBefore = await ethers.provider.getBalance(alice.address);

      const signature = await owner._signTypedData(domainData, types, value);

      [tx, recipt] = await txExec(
        iguWallet.connect(owner)
          .withdraw(
            value.walletAddress,
            value.amount,
            value.fee,
            value.nonce,
            value.deadline,
            signature
          )
      );
    });

    it("Should emit IguToken Transfer event", async () => {
      await expect(tx)
        .to.emit(iguToken, "Transfer")
        .withArgs(iguWallet.address, owner.address, ethers.utils.parseEther("50"));
      await expect(tx)
        .to.emit(iguToken, "Transfer")
        .withArgs(iguWallet.address, owner.address, ethers.utils.parseEther("10"));
    });
  });
});
