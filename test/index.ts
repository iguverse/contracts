import { expect } from "chai";
import { ethers } from "hardhat";

const initialSupply = ethers.BigNumber.from(
  ethers.utils.parseEther("1000000000")
);

describe("GovToken", function () {
  it("Should be burnable", async function () {
    const GovTokenArtifact = await ethers.getContractFactory("GovToken");
    const govtoken = await GovTokenArtifact.deploy();
    await govtoken.deployed();

    expect(await govtoken.totalSupply()).to.equal(initialSupply);

    const burnTx = await govtoken.burn(initialSupply);
    await burnTx.wait();

    expect(await govtoken.totalSupply()).to.equal(ethers.BigNumber.from("0"));
  });

  it("Crowdsale process", async function () {
    const GovTokenArtifact = await ethers.getContractFactory("GovToken");
    const govtoken = await GovTokenArtifact.deploy();
    await govtoken.deployed();

    expect(await govtoken.totalSupply()).to.equal(initialSupply);

    const burnTx = await govtoken.burn(initialSupply);
    await burnTx.wait();

    expect(await govtoken.totalSupply()).to.equal(ethers.BigNumber.from("0"));
  });
});
