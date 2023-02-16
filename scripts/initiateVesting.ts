import { ethers, userConfig } from "hardhat";
import * as hre from "hardhat";
import Parser from "@gregoranders/csv";
import fs from "fs";
import * as path from "path";
import { BigNumber } from "ethers";
import { IguVesting } from "@/IguVesting";
import { IguToken } from "@/IguToken";
import { parseEther } from "ethers/lib/utils";

const csvFilePath = path.resolve(__dirname, "./data/vesting.csv");

const timeGapHours = 20;

type VestingInfo = {
  address: string;
  totalAmount: BigNumber;
  startDate: number;
  endDate: number;
  initialUnlock: BigNumber;
};

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
  const totalAmount = ethers.utils.parseEther(row[1]);
  const initialUnlock = ethers.utils.parseEther(row[3]);
  const startDateX = new Date(row[6]);
  const endDateX = new Date(row[7]);
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

  console.log("Sending Approve transaction");
  const approve = await iguToken.approve(
    iguVesting.address,
    parseEther("400000000")
  );
  console.log("Waiting for approve transaction");
  await approve.wait(5);
  console.log("Approve confirmed");

  for (let i = 0; i < chunks.length; i++) {
    const chunk: VestingInfo[] = chunks[i];

    let addresses = [];
    let amounts = [];
    let startDate = [];
    let endDate = [];
    let initialUnlock = [];

    const timeGapInSeconds = timeGapHours * 60 * 60;

    chunk.map((e) => {
      addresses.push(e.address);
      amounts.push(e.totalAmount);
      startDate.push(e.startDate + timeGapInSeconds);
      endDate.push(e.endDate + timeGapInSeconds);
      initialUnlock.push(e.initialUnlock);
    });

    const checkBalance = await iguVesting.slotsOf(addresses[0]);
    const maxNum = vestings.map((e) => e.address === addresses[0]).length;

    if (checkBalance.gte(maxNum)) {
      console.log(
        "Address already initialed. Stopped initiating, please resolve conflict: remove sent rows"
      );
      return;
    }

    console.log("Sending transaction # " + (i + 1) + " / " + chunks.length);
    const tz = await iguVesting.addVestingEntries(
      addresses,
      amounts,
      startDate,
      endDate,
      initialUnlock
    );
    await tz.wait(2);
    console.log(i, "Added vesting, tz hash: ", tz.hash);
    console.log("---------------------------------");
  }

  // TODO: remove
  // await iguVesting.setStatus();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
