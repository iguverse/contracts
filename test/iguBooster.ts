import {
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts/src.ts/index";
import { Network } from "@ethersproject/networks";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IguBooster, IguToken } from "../typechain-types";
import { deployContract, txExec, timetravel } from "./helpers/utils";

let timestamp = Math.floor(Date.now() / 1000);

describe("Igu Booster", function () {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let bob: SignerWithAddress;

  let iguToken: IguToken;
  let iguBooster: IguBooster;

  let network: Network;

  beforeEach(async () => {
    [owner, signer, bob] = await ethers.getSigners();
    network = await ethers.provider.getNetwork();

    iguToken = await deployContract("IguToken");
    iguBooster = await deployContract(
      "IguBooster",
      iguToken.address,
      signer.address
    );

    await iguToken
      .connect(owner)
      .transfer(bob.address, ethers.utils.parseEther("2"));
  });

  describe("Staking", () => {
    let tx: ContractTransaction;
    let recipt: ContractReceipt;

    beforeEach(async () => {
      const domainData = {
        name: "Iguverse",
        version: "1",
        chainId: network.chainId,
        verifyingContract: iguBooster.address,
      };

      const types = {
        StakeData: [
          { name: "staker", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "durationDays", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        staker: bob.address,
        amount: ethers.utils.parseEther("1"),
        durationDays: 1,
        deadline: timestamp + 30,
      };

      const signature = await signer._signTypedData(domainData, types, value);

      await iguToken
        .connect(bob)
        .approve(iguBooster.address, ethers.utils.parseEther("1"));

      [tx, recipt] = await txExec(
        iguBooster
          .connect(bob)
          .stake(value.amount, value.durationDays, value.deadline, signature)
      );
    });

    it("Should emit Transfer event", async () => {
      await expect(tx)
        .to.emit(iguToken, "Transfer")
        .withArgs(
          bob.address,
          iguBooster.address,
          ethers.utils.parseEther("1")
        );
    });

    describe("Create New Stake", () => {
      let tx: ContractTransaction;
      let recipt: ContractReceipt;


      beforeEach(async () => {
        const domainData = {
          name: "Iguverse",
          version: "1",
          chainId: network.chainId,
          verifyingContract: iguBooster.address,
        };

        const types = {
          StakeData: [
            { name: "staker", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "durationDays", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const value2 = {
          staker: bob.address,
          amount: ethers.utils.parseEther("1"),
          durationDays: 1,
          deadline: timestamp + 30 + 15,
        };

        const signature = await signer._signTypedData(
          domainData,
          types,
          value2
        );

        await iguToken
          .connect(bob)
          .approve(iguBooster.address, ethers.utils.parseEther("1"));

        [tx, recipt] = await txExec(
          iguBooster
            .connect(bob)
            .stake(
              value2.amount,
              value2.durationDays,
              value2.deadline,
              signature
            )
        );
      });

      it("Should emit Transfer event", async () => {
        await expect(tx)
          .to.emit(iguToken, "Transfer")
          .withArgs(
            bob.address,
            iguBooster.address,
            ethers.utils.parseEther("1")
          );
      });

      // it("Should return proper array", async () => {
      //   const arr = await iguBooster.stakesOf(bob.address);
      //   expect(arr).is.eq([
      //     [
      //       bob.address,
      //       ethers.utils.parseEther("1"),
      //       ethers.BigNumber.from(timestamp + 15 + 86400),
      //       false,
      //     ],
      //     [
      //       bob.address,
      //       ethers.utils.parseEther("1"),
      //       ethers.BigNumber.from(timestamp + 15 + 15 + 86400),
      //       false,
      //     ],
      //   ]);
      // });
    });

    describe("Unstaking", () => {
      let tx: ContractTransaction;
      let recipt: ContractReceipt;
      beforeEach(async () => {
        const block = await timetravel(timestamp + 106500);
        timestamp = block.timestamp;
        [tx, recipt] = await txExec(iguBooster.connect(bob).unstake());
      });
      it("Should emit Transfer event", async () => {
        await expect(tx)
          .to.emit(iguToken, "Transfer")
          .withArgs(
            iguBooster.address,
            bob.address,
            ethers.utils.parseEther("1")
          );
      });
      describe("New stake", () => {
        let tx: ContractTransaction;
        let recipt: ContractReceipt;


        beforeEach(async () => {
          const domainData = {
            name: "Iguverse",
            version: "1",
            chainId: network.chainId,
            verifyingContract: iguBooster.address,
          };

          const types = {
            StakeData: [
              { name: "staker", type: "address" },
              { name: "amount", type: "uint256" },
              { name: "durationDays", type: "uint256" },
              { name: "deadline", type: "uint256" },
            ],
          };

          const value2 = {
            staker: bob.address,
            amount: ethers.utils.parseEther("1"),
            durationDays: 1,
            deadline: timestamp + 15,
          };

          const signature = await signer._signTypedData(
            domainData,
            types,
            value2
          );

          await iguToken
            .connect(bob)
            .approve(iguBooster.address, ethers.utils.parseEther("1"));

          [tx, recipt] = await txExec(
            iguBooster
              .connect(bob)
              .stake(
                value2.amount,
                value2.durationDays,
                value2.deadline,
                signature
              )
          );
        });

        it("Should emit Transfer event", async () => {
          await expect(tx)
            .to.emit(iguToken, "Transfer")
            .withArgs(
              bob.address,
              iguBooster.address,
              ethers.utils.parseEther("1")
            );
        });
      });
    });
  });
});
