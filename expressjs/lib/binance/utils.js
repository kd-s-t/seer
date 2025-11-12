const { ethers } = require('ethers');

function formatBNB(amount) {
  return ethers.formatEther(amount);
}

function parseBNB(amount) {
  return ethers.parseEther(amount.toString());
}

module.exports = {
  formatBNB,
  parseBNB
};

