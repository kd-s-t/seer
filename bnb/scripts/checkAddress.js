const hre = require("hardhat");

async function main() {
  console.log("Checking deployed contract address...\n");
  
  const network = hre.network.name;
  console.log("Network:", network);
  
  try {
    const provider = hre.ethers.provider;
    const deployer = (await hre.ethers.getSigners())[0];
    const deployerAddress = await deployer.getAddress();
    
    console.log("Deployer address:", deployerAddress);
    
    const nonce = await provider.getTransactionCount(deployerAddress);
    console.log("Deployer nonce:", nonce);
    
    if (nonce === 0) {
      console.log("\n⚠️  No transactions found from deployer address.");
      console.log("Contract may not be deployed yet, or deployed from a different address.");
    } else {
      console.log("\n📋 Checking recent transactions from deployer...");
      
      console.log("\n📋 Note: Hardhat doesn't store deployment addresses automatically.");
      console.log("   The address is only shown in the deployment output.");
      console.log("\n💡 Quick check: Look at your terminal history for:");
      console.log('   "✅ PredictionStaking deployed to: 0x..."');
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("Alternative ways to find the address:");
    console.log("=".repeat(60));
    console.log("1. Check expressjs/.env for PREDICTION_STAKING_ADDRESS");
    console.log("2. Check nextjs/.env for NEXT_PUBLIC_PREDICTION_STAKING_ADDRESS");
    console.log("3. Check deployment output from: npm run deploy:predictions");
    console.log("4. Check BSCScan for your deployer address transactions");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

