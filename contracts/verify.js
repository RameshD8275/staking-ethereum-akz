/*
    Used to verify smart contracts on ETHERSCAN using hardhat-etherscan plugin
    Runs the verify task
*/

const { run } = require("hardhat");

const verify = async (contractAddress, args, contract) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

module.exports = {
  verify,
};
