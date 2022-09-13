import { ethers } from "hardhat";

// Note: Set the contract addresses addresses and configure pairs array

const contractAddresses = {
  IGU: "",
  BUSD: "",
  WBNB: "",
  IGUP: "",
  factory: "",
  router: "",
};

const pairs = [
  {
    contractA: contractAddresses.IGU,
    contractB: contractAddresses.BUSD,
    amountA: ethers.utils.parseEther("1666666"),
    amountB: ethers.utils.parseEther("100000"),
  },
  {
    // Needed for testnet
    contractA: contractAddresses.BUSD,
    contractB: contractAddresses.WBNB,
    amountA: ethers.utils.parseEther("2800"),
    amountB: ethers.utils.parseEther("10"),
  },
  {
    contractA: contractAddresses.IGUP,
    contractB: contractAddresses.BUSD,
    amountA: ethers.utils.parseEther("2000000"),
    amountB: ethers.utils.parseEther("20000"),
  },
];

async function main() {
  const signer = await ethers.provider.getSigner().getAddress();

  const wbnb = await ethers.getContractAt("IWBNB", contractAddresses.WBNB);

  const router = await ethers.getContractAt(
    "IPancakeRouter02",
    contractAddresses.router
  );

  const factory = await ethers.getContractAt(
    "IPancakeFactory",
    contractAddresses.factory
  );

  // Creating BUSD <-> IGU pair
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    // Creating pair if needed
    const retPair = await factory.getPair(pair.contractA, pair.contractB);
    if (retPair === ethers.constants.AddressZero) {
      await factory.createPair(pair.contractA, pair.contractB);
    }

    // Making contract instances
    const erc20Artifact = await ethers.getContractFactory("tBUSD");
    const contractA = await erc20Artifact.attach(pair.contractA);
    const contractB = await erc20Artifact.attach(pair.contractB);

    // Checking balances, allowances and set approvals if needed
    let balanceA = ethers.utils.parseEther("0");
    let balanceB = ethers.utils.parseEther("0");
    balanceA = await contractA.balanceOf(signer);
    balanceB = await contractB.balanceOf(signer);
    if (
      pair.contractA !== contractAddresses.WBNB &&
      balanceA.lt(pair.amountA)
    ) {
      console.log(
        "Error: balance of " +
          pair.contractA +
          " is lesser than needed. Required:" +
          ethers.utils.formatEther(pair.amountA) +
          " actual: " +
          ethers.utils.formatEther(balanceA)
      );
      return;
    }
    if (
      pair.contractB !== contractAddresses.WBNB &&
      balanceB.lt(pair.amountB)
    ) {
      console.log(
        "Error: balance of " +
          pair.contractB +
          " is lesser than needed. Required:" +
          ethers.utils.formatEther(pair.amountB) +
          " actual: " +
          ethers.utils.formatEther(balanceB)
      );
      return;
    }
    let approvedA = ethers.utils.parseEther("0");
    let approvedB = ethers.utils.parseEther("0");
    approvedA = await contractA.allowance(signer, contractAddresses.router);
    approvedB = await contractB.allowance(signer, contractAddresses.router);
    if (approvedA.lt(pair.amountA)) {
      await contractA.approve(
        contractAddresses.router,
        pair.amountA.sub(approvedA)
      );
    }
    if (approvedB.lt(pair.amountB)) {
      await contractB.approve(
        contractAddresses.router,
        pair.amountB.sub(approvedB)
      );
    }

    // Wrap BNB if needed
    let sum = ethers.utils.parseEther("0");
    if (pair.contractA === contractAddresses.WBNB) sum = pair.amountA;
    else if (pair.contractB === contractAddresses.WBNB) sum = pair.amountB;
    if (sum.gt(ethers.utils.parseEther("0"))) {
      const signerBalanceBNB = await ethers.provider.getBalance(signer);
      const signerBalanceWBNB = await wbnb.balanceOf(signer);
      if (signerBalanceWBNB.lt(sum)) {
        if (signerBalanceBNB.add(signerBalanceWBNB).lt(sum)) {
          console.log("Error: Not enough BNB + WBNB");
          return;
        }
        const toWrap = sum.sub(signerBalanceWBNB);
        if (toWrap.gt(ethers.utils.parseEther("0"))) {
          await wbnb.deposit({ value: toWrap });
        }
      }
    }

    // Adding liquidity
    await router.addLiquidity(
      pair.contractA,
      pair.contractB,
      pair.amountA,
      pair.amountB,
      0,
      0,
      signer,
      2208988800,
      { gasLimit: 3000000 }
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
