const hre = require("hardhat");

async function main() {
  const recipientAddress = '0x3adf9dac83a382bde820e1d15dbd0a57c4b034a6';
  
  console.log('Connecting to Hardhat node...');
  
  try {
    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString());
    
    const accounts = await hre.ethers.getSigners();
    console.log('Available accounts:', accounts.length);
    
    if (accounts.length === 0) {
      console.error('No accounts available!');
      process.exit(1);
    }
    
    const sender = accounts[0];
    const senderBalance = await provider.getBalance(sender.address);
    console.log('Sender address:', sender.address);
    console.log('Sender balance:', hre.ethers.formatEther(senderBalance), 'ETH');
    
    if (senderBalance === 0n) {
      console.error('Sender has no balance!');
      process.exit(1);
    }
    
    const beforeBalance = await provider.getBalance(recipientAddress);
    console.log('Recipient balance before:', hre.ethers.formatEther(beforeBalance), 'ETH');
    
    const amount = hre.ethers.parseEther("10");
    console.log('\nSending 10 BNB to:', recipientAddress);
    
    const tx = await sender.sendTransaction({
      to: recipientAddress,
      value: amount,
    });
    
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');
    
    await tx.wait();
    console.log('Transaction confirmed!');
    
    const recipientBalance = await provider.getBalance(recipientAddress);
    console.log('Recipient balance after:', hre.ethers.formatEther(recipientBalance), 'ETH');
    console.log('\n✅ Funding complete!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nHardhat node is not running!');
      console.error('Please start it with: npx hardhat node');
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

