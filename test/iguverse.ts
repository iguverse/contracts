import { IguToken } from "@/IguToken";
import { Iguverse } from "@/Iguverse";
import {
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts/src.ts/index";
import { Network } from "@ethersproject/networks";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployContract, txExec } from "./helpers/utils";

describe("Iguverse", function () {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  let iguToken: IguToken;
  let iguverse: Iguverse;

  let network: Network;

  beforeEach(async () => {
    [owner, signer, bob, alice] = await ethers.getSigners();
    network = await ethers.provider.getNetwork();

    iguToken = await deployContract("IguToken");
    iguverse = await deployContract(
      "Iguverse",
      "Iguverse",
      "Igu",
      "https://metadata.com/",
      signer.address
    );

    await iguToken
      .connect(owner)
      .transfer(bob.address, ethers.utils.parseEther("100"));

    await iguToken
      .connect(bob)
      .approve(iguverse.address, ethers.utils.parseEther("1"));

    await owner.sendTransaction({
      to: iguverse.address,
      value: ethers.utils.parseEther("1"),
    });
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
        verifyingContract: iguverse.address,
      };

      const types = {
        ExecData: [
          { name: "tokensToBurn", type: "uint256[]" },
          { name: "tokensToMint", type: "uint256" },
          { name: "mintReceiver", type: "address" },
          { name: "ptFromAccount", type: "address" },
          { name: "ptFromAccountReceivers", type: "address[]" },
          { name: "fromAccountAmounts", type: "uint256[]" },
          { name: "ptFromContract", type: "address" },
          { name: "ptFromContractReceivers", type: "address[]" },
          { name: "fromContractAmounts", type: "uint256[]" },
          { name: "executor", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        tokensToBurn: [],
        tokensToMint: 1,
        mintReceiver: bob.address,
        ptFromAccount: iguToken.address,
        ptFromAccountReceivers: [iguverse.address],
        fromAccountAmounts: [ethers.utils.parseEther("1")],
        ptFromContract: ethers.constants.AddressZero,
        ptFromContractReceivers: [alice.address],
        fromContractAmounts: [ethers.utils.parseEther("1")],
        executor: bob.address,
        nonce: 1,
        deadline: 1000000000000,
      };

      balanceBefore = await ethers.provider.getBalance(alice.address);

      const signature = await signer._signTypedData(domainData, types, value);

      [tx, recipt] = await txExec(
        iguverse
          .connect(bob)
          .execTransaction(
            value.tokensToBurn,
            value.tokensToMint,
            value.mintReceiver,
            value.ptFromAccount,
            value.ptFromAccountReceivers,
            value.fromAccountAmounts,
            value.ptFromContract,
            value.ptFromContractReceivers,
            value.fromContractAmounts,
            value.nonce,
            value.deadline,
            signature
          )
      );
    });

    it("Should emit IguToken Transfer event", async () => {
      await expect(tx)
        .to.emit(iguToken, "Transfer")
        .withArgs(bob.address, iguverse.address, ethers.utils.parseEther("1"));
    });

    it("Should mint Iguverse token", async () => {
      await expect(tx)
        .to.emit(iguverse, "Transfer")
        .withArgs(ethers.constants.AddressZero, bob.address, "0");
    });

    it("Should transfer eth from contract", async () => {
      expect(await ethers.provider.getBalance(alice.address)).to.be.eql(
        balanceBefore.add(ethers.utils.parseEther("1"))
      );
    });
  });
});
