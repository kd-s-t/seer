const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    // Get signers (accounts)
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy contract
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
  });

  describe("Market Creation", function () {
    it("Should create a new market", async function () {
      const question = "Will Bitcoin reach $100k by end of 2024?";
      const outcomes = ["Yes", "No"];
      const durationHours = 72;

      const tx = await predictionMarket
        .connect(owner)
        .createMarket(question, outcomes, durationHours);
      
      await expect(tx)
        .to.emit(predictionMarket, "MarketCreated")
        .withArgs(1, owner.address, question);

      const market = await predictionMarket.getMarket(1);
      expect(market.question).to.equal(question);
      expect(market.creator).to.equal(owner.address);
      expect(market.resolved).to.be.false;
    });

    it("Should reject market with less than 2 outcomes", async function () {
      const question = "Test question";
      const outcomes = ["Only one"];
      const durationHours = 24;

      await expect(
        predictionMarket.connect(owner).createMarket(question, outcomes, durationHours)
      ).to.be.revertedWith("Must have at least 2 outcomes");
    });

    it("Should reject invalid duration", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const durationHours = 0;

      await expect(
        predictionMarket.connect(owner).createMarket(question, outcomes, durationHours)
      ).to.be.revertedWith("Duration must be 1-168 hours");
    });

    it("Should increment market count", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const durationHours = 24;

      expect(await predictionMarket.marketCount()).to.equal(0);
      
      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      expect(await predictionMarket.marketCount()).to.equal(1);
      
      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      expect(await predictionMarket.marketCount()).to.equal(2);
    });
  });

  describe("Placing Bets", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will Bitcoin reach $100k?";
      const outcomes = ["Yes", "No"];
      const durationHours = 72;

      const tx = await predictionMarket
        .connect(owner)
        .createMarket(question, outcomes, durationHours);
      
      const receipt = await tx.wait();
      marketId = 1;
    });

    it("Should allow placing a bet", async function () {
      const outcome = 0; // "Yes"
      const betAmount = ethers.parseEther("0.1");

      await expect(
        predictionMarket.connect(user1).placeBet(marketId, outcome, { value: betAmount })
      )
        .to.emit(predictionMarket, "BetPlaced")
        .withArgs(marketId, user1.address, outcome, betAmount);

      const userBet = await predictionMarket.getUserBet(marketId, user1.address, outcome);
      expect(userBet).to.equal(betAmount);

      const outcomePool = await predictionMarket.getOutcomePool(marketId, outcome);
      expect(outcomePool).to.equal(betAmount);

      const market = await predictionMarket.getMarket(marketId);
      expect(market.totalPool).to.equal(betAmount);
    });

    it("Should reject bet below minimum", async function () {
      const outcome = 0;
      const betAmount = ethers.parseEther("0.0001"); // Below 0.001 minimum

      await expect(
        predictionMarket.connect(user1).placeBet(marketId, outcome, { value: betAmount })
      ).to.be.revertedWith("Bet too small");
    });

    it("Should reject bet on invalid outcome", async function () {
      const outcome = 5; // Invalid outcome
      const betAmount = ethers.parseEther("0.1");

      await expect(
        predictionMarket.connect(user1).placeBet(marketId, outcome, { value: betAmount })
      ).to.be.revertedWith("Invalid outcome");
    });

    it("Should allow multiple bets from same user", async function () {
      const outcome = 0;
      const betAmount1 = ethers.parseEther("0.1");
      const betAmount2 = ethers.parseEther("0.2");

      await predictionMarket.connect(user1).placeBet(marketId, outcome, { value: betAmount1 });
      await predictionMarket.connect(user1).placeBet(marketId, outcome, { value: betAmount2 });

      const userBet = await predictionMarket.getUserBet(marketId, user1.address, outcome);
      expect(userBet).to.equal(betAmount1 + betAmount2);
    });

    it("Should track multiple outcome pools", async function () {
      const betAmount1 = ethers.parseEther("0.1");
      const betAmount2 = ethers.parseEther("0.2");

      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: betAmount1 });
      await predictionMarket.connect(user2).placeBet(marketId, 1, { value: betAmount2 });

      const pool0 = await predictionMarket.getOutcomePool(marketId, 0);
      const pool1 = await predictionMarket.getOutcomePool(marketId, 1);
      const market = await predictionMarket.getMarket(marketId);

      expect(pool0).to.equal(betAmount1);
      expect(pool1).to.equal(betAmount2);
      expect(market.totalPool).to.equal(betAmount1 + betAmount2);
    });
  });

  describe("Market Resolution", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will Bitcoin reach $100k?";
      const outcomes = ["Yes", "No"];
      const durationHours = 72;

      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      marketId = 1;

      // Place some bets
      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: ethers.parseEther("0.1") });
      await predictionMarket.connect(user2).placeBet(marketId, 1, { value: ethers.parseEther("0.2") });
    });

    it("Should allow creator to resolve market", async function () {
      const winningOutcome = 0;

      await expect(
        predictionMarket.connect(owner).resolveMarket(marketId, winningOutcome)
      )
        .to.emit(predictionMarket, "MarketResolved")
        .withArgs(marketId, winningOutcome);

      const market = await predictionMarket.getMarket(marketId);
      expect(market.resolved).to.be.true;
      expect(market.winningOutcome).to.equal(winningOutcome);
    });

    it("Should reject resolution by non-creator before end time", async function () {
      const winningOutcome = 0;

      await expect(
        predictionMarket.connect(user1).resolveMarket(marketId, winningOutcome)
      ).to.be.revertedWith("Not authorized or too early");
    });

    it("Should reject resolution of already resolved market", async function () {
      await predictionMarket.connect(owner).resolveMarket(marketId, 0);

      await expect(
        predictionMarket.connect(owner).resolveMarket(marketId, 1)
      ).to.be.revertedWith("Market already resolved");
    });

    it("Should reject invalid winning outcome", async function () {
      await expect(
        predictionMarket.connect(owner).resolveMarket(marketId, 5)
      ).to.be.revertedWith("Invalid outcome");
    });
  });

  describe("Claiming Winnings", function () {
    let marketId;

    beforeEach(async function () {
      const question = "Will Bitcoin reach $100k?";
      const outcomes = ["Yes", "No"];
      const durationHours = 72;

      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      marketId = 1;
    });

    it("Should allow winner to claim winnings", async function () {
      const betAmount = ethers.parseEther("0.1");
      const otherBetAmount = ethers.parseEther("0.2");

      // User1 bets on outcome 0, User2 bets on outcome 1
      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: betAmount });
      await predictionMarket.connect(user2).placeBet(marketId, 1, { value: otherBetAmount });

      // Resolve with outcome 0 as winner
      await predictionMarket.connect(owner).resolveMarket(marketId, 0);

      // User1 should be able to claim
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const claimTx = await predictionMarket.connect(user1).claimWinnings(marketId);
      const claimReceipt = await claimTx.wait();
      const claimGasUsed = claimReceipt.gasUsed * claimReceipt.gasPrice;
      
      // Withdraw the claimed winnings
      const withdrawTx = await predictionMarket.connect(user1).withdraw();
      const withdrawReceipt = await withdrawTx.wait();
      const withdrawGasUsed = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;
      const totalGasUsed = claimGasUsed + withdrawGasUsed;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);

      // User1 should get their share minus platform fee (2%)
      // Total pool: 0.3 BNB, User1 share: 0.3 * (0.1/0.1) = 0.3 BNB
      // Platform fee: 0.3 * 0.02 = 0.006 BNB
      // Payout: 0.3 - 0.006 = 0.294 BNB
      const expectedPayout = ethers.parseEther("0.294");
      const balanceChange = finalBalance - initialBalance + totalGasUsed;
      
      // Allow small difference for gas
      expect(balanceChange).to.be.closeTo(expectedPayout, ethers.parseEther("0.001"));
    });

    it("Should reject claim by non-winner", async function () {
      const betAmount = ethers.parseEther("0.1");

      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: betAmount });
      await predictionMarket.connect(owner).resolveMarket(marketId, 1); // Outcome 1 wins

      await expect(
        predictionMarket.connect(user1).claimWinnings(marketId)
      ).to.be.revertedWith("No winning bets");
    });

    it("Should reject claim on unresolved market", async function () {
      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: ethers.parseEther("0.1") });

      await expect(
        predictionMarket.connect(user1).claimWinnings(marketId)
      ).to.be.revertedWith("Market not resolved");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw their balance", async function () {
      // First, create a market, bet, resolve, and claim to build up balance
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const durationHours = 24;

      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      const marketId = 1;

      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: ethers.parseEther("0.1") });
      await predictionMarket.connect(owner).resolveMarket(marketId, 0);
      await predictionMarket.connect(user1).claimWinnings(marketId);

      // Now withdraw
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await predictionMarket.connect(user1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);

      const balance = await predictionMarket.balances(user1.address);
      expect(balance).to.equal(0);

      // Balance should have increased (minus gas)
      expect(finalBalance).to.be.gt(initialBalance - gasUsed);
    });

    it("Should reject withdrawal with zero balance", async function () {
      await expect(
        predictionMarket.connect(user1).withdraw()
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple markets independently", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const durationHours = 24;

      // Create two markets
      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);

      // Bet on different outcomes in each market
      await predictionMarket.connect(user1).placeBet(1, 0, { value: ethers.parseEther("0.1") });
      await predictionMarket.connect(user1).placeBet(2, 1, { value: ethers.parseEther("0.2") });

      const bet1 = await predictionMarket.getUserBet(1, user1.address, 0);
      const bet2 = await predictionMarket.getUserBet(2, user1.address, 1);

      expect(bet1).to.equal(ethers.parseEther("0.1"));
      expect(bet2).to.equal(ethers.parseEther("0.2"));
    });

    it("Should calculate correct payout ratios", async function () {
      const question = "Test question";
      const outcomes = ["Yes", "No"];
      const durationHours = 24;

      await predictionMarket.connect(owner).createMarket(question, outcomes, durationHours);
      const marketId = 1;

      // User1 bets 0.1 on outcome 0
      // User2 bets 0.2 on outcome 0
      // User3 bets 0.3 on outcome 1
      // Total pool: 0.6 BNB
      // If outcome 0 wins: User1 gets 0.6 * (0.1/0.3) = 0.2 BNB, User2 gets 0.6 * (0.2/0.3) = 0.4 BNB
      // Platform fee: 2% of each payout

      await predictionMarket.connect(user1).placeBet(marketId, 0, { value: ethers.parseEther("0.1") });
      await predictionMarket.connect(user2).placeBet(marketId, 0, { value: ethers.parseEther("0.2") });
      await predictionMarket.connect(user3).placeBet(marketId, 1, { value: ethers.parseEther("0.3") });

      await predictionMarket.connect(owner).resolveMarket(marketId, 0);

      // Claim winnings
      await predictionMarket.connect(user1).claimWinnings(marketId);
      await predictionMarket.connect(user2).claimWinnings(marketId);

      // Check balances
      const balance1 = await predictionMarket.balances(user1.address);
      const balance2 = await predictionMarket.balances(user2.address);

      // User1: 0.2 - (0.2 * 0.02) = 0.196 BNB
      // User2: 0.4 - (0.4 * 0.02) = 0.392 BNB
      expect(balance1).to.be.closeTo(ethers.parseEther("0.196"), ethers.parseEther("0.001"));
      expect(balance2).to.be.closeTo(ethers.parseEther("0.392"), ethers.parseEther("0.001"));
    });
  });
});

