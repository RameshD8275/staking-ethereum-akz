
const { ethers, run, network } = require("hardhat");
const hreconfig = require('hardhat-configs');
// const hreconfig = require("@nomicsfoundation/hardhat-config");
const { sleep } = require('sleep-ts');

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
  
  const networkName = network.name;
  // Check if the network is supported.
  console.log(`Deploying to ${networkName} network...`);

  console.log('deploying...');
  const retVal = await hreconfig.hreInit(hre);
  if (!retVal) {
    console.log('hardhat init error!');
    return false;
  }

  await run('clean');
  await run('compile');
  console.log('hardhat init OK');
  console.log('Compiled contracts...');

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const staking = await ethers.getContractFactory("Staking");
  const stakingContract = await staking.connect(deployer).deploy('0xaa2663C73cda62b543356c3Dc7DDAC387856ca27');
  await stakingContract.waitForDeployment();

  const deployedAddr = await stakingContract.getAddress();
  console.log("StakingContract deployed at:", deployedAddr);
  
  console.log('Verifying contract....')
  await sleep(20000);

  await verify(deployedAddr, ['0xaa2663C73cda62b543356c3Dc7DDAC387856ca27']);
  
  console.log("##### Contract verified");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
