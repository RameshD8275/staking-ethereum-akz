
const { ethers } = require("hardhat");
const { verify } = require("./verify");
const { sleep } = require('sleep-ts');

const tokenArgs = [process.env.ERC20_NAME, process.env.ERC20_SYMBOL, process.env.ERC20_INITIALSUPPLY]
async function main() {
  // const [deployer] = await ethers.getSigners();

  // console.log("Deploying contracts with the account:", deployer.address);

  // const Token = await ethers.getContractFactory("TestERC20");
  // const TokenContract = await Token.connect(deployer).deploy(...tokenArgs);

  // await TokenContract.waitForDeployment();

  // const deployedAddr = await TokenContract.getAddress();

  // console.log("TokenContract deployed at:", deployedAddr);

  // await sleep(20000)

  await verify('0xaa2663C73cda62b543356c3Dc7DDAC387856ca27',[...tokenArgs],"contracts/Token.sol:TestERC20");
  
  console.log("##### TokenContract verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
