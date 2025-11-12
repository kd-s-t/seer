const hre = require("hardhat");

async function main() {
  console.log("Deploying Prediction contracts...\n");

  // Deploy PredictionStaking (consolidated with PredictionTracker)
  console.log("1. Deploying PredictionStaking...");
  const PredictionStaking = await hre.ethers.getContractFactory("PredictionStaking");
  const predictionStaking = await PredictionStaking.deploy();
  await predictionStaking.waitForDeployment();
  const stakingAddress = await predictionStaking.getAddress();
  console.log("✅ PredictionStaking deployed to:", stakingAddress);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("\nAdd this to your expressjs/.env file:");
  console.log(`PREDICTION_STAKING_ADDRESS=${stakingAddress}`);
  console.log("\nAdd this to your nextjs/.env.local file:");
  console.log(`NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS=${stakingAddress}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
