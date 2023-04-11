import {
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts/src.ts/index";
import { Network } from "@ethersproject/networks";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IgupToken } from "../typechain-types";
import { deployContract, txExec } from "./helpers/utils";

describe("Igup Token", function () {
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let bob: SignerWithAddress;

  let igupToken: IgupToken;

  let network: Network;

  beforeEach(async () => {
    [owner, signer, bob] = await ethers.getSigners();
    network = await ethers.provider.getNetwork();

    igupToken = await deployContract("IgupToken", signer.address);
  });

  describe("Signatures", () => {
    let tx: ContractTransaction;
    let recipt: ContractReceipt;

    beforeEach(async () => {
      const domainData = {
        name: "Iguverse",
        version: "1",
        chainId: network.chainId,
        verifyingContract: igupToken.address,
      };

      const types = {
        CollectData: [
          { name: "receiver", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const value = {
        receiver: bob.address,
        amount: ethers.utils.parseEther("1"),
        nonce: "1",
      };

      const signature = await signer._signTypedData(domainData, types, value);

      [tx, recipt] = await txExec(
        igupToken.connect(bob).collect(value.receiver, value.amount, value.nonce, signature)
      );
    });

    it("Should emit Transfer event", async () => {
      await expect(tx)
        .to.emit(igupToken, "Transfer")
        .withArgs(
          ethers.constants.AddressZero,
          bob.address,
          ethers.utils.parseEther("1")
        );
    });
  });
});
