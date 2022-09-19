import { ethers } from "hardhat";
import * as hre from "hardhat";
import Parser from "@gregoranders/csv";
import fs from "fs";
import * as path from "path";
import { BigNumber } from "ethers";
import { IguVesting } from "@/IguVesting";
import { IguToken } from "@/IguToken";

const csvFilePath = path.resolve(__dirname, "./data/vesting.csv");

type VestingInfo = {
  address: string;
  totalAmount: BigNumber;
  startDate: number;
  endDate: number;
  initialUnlock: BigNumber;
};

function swapMonth(value) {
  return (
    value.substr(3, 2) +
    "." +
    value.substr(0, 2) +
    "." +
    value.substr(6, 4) +
    " " +
    value.substr(11, 18)
  );
}

function getChunks(array, chunkSize): any[] {
  let chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

const parser = new Parser();
const rows = parser.parse(fileContent);

let vestings: VestingInfo[] | any[] = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const address = row[0];
  const totalAmount = ethers.utils.parseEther(row[3]);
  const initialUnlock = ethers.utils.parseEther(row[9]);
  const startDateX = new Date(swapMonth(row[5]));
  const endDateX = new Date(swapMonth(row[6]));
  const startDate = Math.floor(startDateX.getTime() / 1000);
  const endDate = Math.floor(endDateX.getTime() / 1000);
  const vestingInfo: VestingInfo = {
    address,
    totalAmount,
    startDate,
    endDate,
    initialUnlock,
  };
  vestings.push(vestingInfo);
}

let chunks = [];
chunks = getChunks(vestings, 50);

async function main() {
  const deployment = await hre.deployments.get("IguVesting");
  const iguVesting: IguVesting = await ethers.getContractAt(
    "IguVesting",
    deployment.address
  );

  const deploymentToken = await hre.deployments.get("IguToken");
  const iguToken: IguToken = await ethers.getContractAt(
    "IguToken",
    deploymentToken.address
  );

  for (let i = 0; i < chunks.length; i++) {
    const chunk: VestingInfo[] = chunks[i];

    let addresses = [];
    let amounts = [];
    let startDate = [];
    let endDate = [];
    let initialUnlock = [];

    chunk.map((e) => {
      addresses.push(e.address);
      amounts.push(e.totalAmount);
      startDate.push(e.startDate);
      endDate.push(e.endDate);
      initialUnlock.push(e.initialUnlock);
    });

    await iguVesting.addVestingEntries(
      addresses,
      amounts,
      startDate,
      endDate,
      initialUnlock
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
