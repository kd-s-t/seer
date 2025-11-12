const { ethers } = require('ethers');

async function main() {
  const RPC_URL = 'http://localhost:8545';
  const RECIPIENT = '0x4d3ebc244b5d875f8b284e54e76acbb7eaf1afae';
  
  console.log('Connecting to', RPC_URL, '...');
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Get the first account (Hardhat default account 0)
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts found. Make sure Hardhat node is running.');
    }
    
    const sender = accounts[0];
    console.log('Using sender:', sender);
    
    // Get sender balance
    const senderBalance = await provider.getBalance(sender);
    console.log('Sender balance:', ethers.formatEther(senderBalance), 'ETH');
    
    if (senderBalance === 0n) {
      throw new Error('Sender has no balance!');
    }
    
    // Get recipient balance before
    const beforeBalance = await provider.getBalance(RECIPIENT);
    console.log('Recipient balance before:', ethers.formatEther(beforeBalance), 'ETH');
    
    // Create wallet from first account (we need private key, but Hardhat node exposes accounts)
    // Actually, we need to use Hardhat's signer
    const hre = require('hardhat');
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    
    console.log('Sending 100 ETH to', RECIPIENT, '...');
    const tx = await signer.sendTransaction({
      to: RECIPIENT,
      value: ethers.parseEther('100'),
    });
    
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');
    
    await tx.wait();
    console.log('Transaction confirmed!');
    
    // Get recipient balance after
    const afterBalance = await provider.getBalance(RECIPIENT);
    console.log('Recipient balance after:', ethers.formatEther(afterBalance), 'ETH');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  Hardhat node is not running!');
      console.error('Please start it in another terminal with:');
      console.error('  cd bnb');
      console.error('  npx hardhat node');
    }
    process.exit(1);
  }
}

main();

