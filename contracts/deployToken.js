
const { ethers } = require("hardhat");
const { verify } = require("./verify");

async function main() {

  // const [deployer] = await ethers.getSigners();

  // console.log("Deploying contracts with the account:", deployer.address);

  // const Token = await ethers.getContractFactory("Token");
  // const TokenContract = await Token.connect(deployer).deploy();

  // await TokenContract.waitForDeployment();

  // const deployedAddr = await TokenContract.getAddress();

  // console.log("TokenContract deployed at:", deployedAddr);

  // await verify(deployedAddr,[],"contracts/TToken.sol:Token");
  await verify('0x4ed3a5Cd4280B38B7e53D80aA4117eE498e37977',[],"contracts/TToken.sol:Token");
  
  console.log("##### TokenContract verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
