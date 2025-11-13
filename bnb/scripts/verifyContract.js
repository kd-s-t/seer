const hre = require("hardhat");

async function main() {
  const contractAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("Verifying contract at address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("");
  
  try {
    const provider = hre.ethers.provider;
    
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x" || code === "") {
      console.log("❌ No contract code found at this address.");
      console.log("This address is an EOA (Externally Owned Account), not a contract.");
      console.log("");
      console.log("💡 Solution: Deploy the contract first:");
      console.log("   npm run deploy:predictions:local");
      console.log("");
      console.log("Then update your .env files with the deployed contract address.");
    } else {
      console.log("✅ Contract code found at this address.");
      console.log("Code length:", code.length, "characters");
      console.log("");
      
      try {
        const contract = await hre.ethers.getContractAt("PredictionStaking", contractAddress);
        console.log("✅ Successfully connected to PredictionStaking contract");
        
        try {
          const predictionCount = await contract.predictionCount();
          console.log("   Prediction Count:", predictionCount.toString());
        } catch (e) {
          console.log("   ⚠️  Could not read predictionCount (contract may not match ABI)");
        }
        
        try {
          const hasRecordPrediction = contract.interface.hasFunction("recordPrediction");
          console.log("   Has recordPrediction function:", hasRecordPrediction);
        } catch (e) {
          console.log("   ⚠️  Could not verify function existence");
        }
      } catch (e) {
        console.log("⚠️  Contract exists but may not be PredictionStaking:");
        console.log("   Error:", e.message);
      }
    }
  } catch (error) {
    console.error("Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

