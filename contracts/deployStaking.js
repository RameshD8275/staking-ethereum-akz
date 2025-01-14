
const { ethers, run, network } = require("hardhat");
const hreconfig = require('hardhat-configs');

const verify = async (address, parameter = []) => {
  console.log(`Veryfing ${address} ...`);
  await run('verify:verify', {
    address: address,
    constructorArguments: parameter,
  });
  console.log('Success!');
};

async function main() {
  // Get network data from Hardhat config (see hardhat.config.ts).
  
  // const networkName = network.name;
  // // Check if the network is supported.
  // console.log(`Deploying to ${networkName} network...`);

  // console.log('deploying...');
  // const retVal = await hreconfig.hreInit(hre);
  // if (!retVal) {
  //   console.log('hardhat init error!');
  //   return false;
  // }

  // await run('clean');
  // await run('compile');
  // console.log('hardhat init OK');
  // console.log('Compiled contracts...');

  // const [deployer] = await ethers.getSigners();

  // console.log("Deploying contracts with the account:", deployer.address);

  // const staking = await ethers.getContractFactory("Staking");
  // const stakingContract = await staking.connect(deployer).deploy('0x4ed3a5Cd4280B38B7e53D80aA4117eE498e37977');
  // await stakingContract.waitForDeployment();

  // const deployedAddr = await stakingContract.getAddress();
  // console.log("StakingContract deployed at:", deployedAddr);

  await verify('0xBa077f30BaDb144e8e339106ebA6ee655b3cd97a', ['0x4ed3a5Cd4280B38B7e53D80aA4117eE498e37977']);
  
  console.log("##### Contract verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
