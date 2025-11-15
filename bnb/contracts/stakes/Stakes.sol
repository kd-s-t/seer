// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Stakes {
    struct Stake {
        address createdBy;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 libraryId; // Optional: 0 means not linked to a library
        bool rewarded;
        bool predictionCorrect; // Was the prediction correct?
        bool stakeUp;
        string cryptoId;
        uint256 currentPrice;
        uint256 predictedPrice;
        uint256 actualPrice; // Set when resolved
        string direction;
        uint256 percentChange;
    }
    
    struct Staker {
        uint256 id;
        address wallet;
        uint256 stakeId;
        uint256 amountInBNB;
        uint256 createdAt;
        bool stakeUp;
        bool rewarded;
    }
    
    uint256 public stakeCount;
    mapping(uint256 => Stake) public stakes;
    
    uint256 public stakerCount;
    mapping(uint256 => Staker) public stakers;
    mapping(uint256 => uint256[]) public stakeStakers; // stakeId -> array of staker IDs
    
    uint256 public constant MIN_STAKE = 0.00001 ether;
    uint256 public constant STAKE_EXPIRY_WINDOW = 48 hours;
    
    event StakePlaced(
        uint256 indexed stakeId,
        address indexed createdBy,
        uint256 amount,
        bool stakeUp,
        uint256 timestamp
    );
    
    event StakerJoined(
        uint256 indexed stakerId,
        uint256 indexed stakeId,
        address indexed wallet,
        uint256 amount,
        bool stakeUp,
        uint256 timestamp
    );
    
    function createStake(
        string memory cryptoId,
        uint256 currentPrice,
        uint256 predictedPrice,
        string memory direction,
        uint256 percentChange,
        bool stakeUp,
        uint256 libraryId
    ) external payable returns (uint256 stakeId) {
        require(msg.value >= MIN_STAKE, "Stake too small");
        require(bytes(cryptoId).length > 0, "Crypto ID cannot be empty");
        require(currentPrice > 0, "Current price must be greater than 0");
        require(predictedPrice > 0, "Predicted price must be greater than 0");
        require(bytes(direction).length > 0, "Direction cannot be empty");
        require(keccak256(bytes(direction)) == keccak256(bytes("up")) || keccak256(bytes(direction)) == keccak256(bytes("down")), "Direction must be 'up' or 'down'");
        
        stakeCount++;
        stakeId = stakeCount;
        
        Stake storage stake = stakes[stakeId];
        stake.createdBy = msg.sender;
        stake.createdAt = block.timestamp;
        stake.expiresAt = block.timestamp + STAKE_EXPIRY_WINDOW;
        stake.libraryId = libraryId; // 0 means not linked to a library
        stake.rewarded = false;
        stake.predictionCorrect = false; // Will be set when resolved
        stake.stakeUp = stakeUp;
        stake.cryptoId = cryptoId;
        stake.currentPrice = currentPrice;
        stake.predictedPrice = predictedPrice;
        stake.actualPrice = 0; // Will be set when resolved
        stake.direction = direction;
        stake.percentChange = percentChange;
        
        emit StakePlaced(stakeId, msg.sender, msg.value, stakeUp, block.timestamp);
        
        // Automatically stake the creator on their own stake
        stakerCount++;
        uint256 stakerId = stakerCount;
        
        Staker storage staker = stakers[stakerId];
        staker.id = stakerId;
        staker.wallet = msg.sender;
        staker.stakeId = stakeId;
        staker.amountInBNB = msg.value;
        staker.createdAt = block.timestamp;
        staker.stakeUp = stakeUp;
        staker.rewarded = false;
        
        stakeStakers[stakeId].push(stakerId);
        
        emit StakerJoined(stakerId, stakeId, msg.sender, msg.value, stakeUp, block.timestamp);
        
        return stakeId;
    }
    
    function getStake(uint256 stakeId) external view returns (
        address createdBy,
        uint256 createdAt,
        uint256 expiresAt,
        uint256 libraryId,
        bool rewarded,
        bool predictionCorrect,
        bool stakeUp,
        string memory cryptoId,
        uint256 currentPrice,
        uint256 predictedPrice,
        uint256 actualPrice,
        string memory direction,
        uint256 percentChange
    ) {
        Stake storage stake = stakes[stakeId];
        require(stake.createdBy != address(0), "Stake does not exist");
        
        return (
            stake.createdBy,
            stake.createdAt,
            stake.expiresAt,
            stake.libraryId,
            stake.rewarded,
            stake.predictionCorrect,
            stake.stakeUp,
            stake.cryptoId,
            stake.currentPrice,
            stake.predictedPrice,
            stake.actualPrice,
            stake.direction,
            stake.percentChange
        );
    }
    
    function _resolveStake(uint256 stakeId, uint256 actualPrice) internal {
        Stake storage stake = stakes[stakeId];
        require(stake.createdBy != address(0), "Stake does not exist");
        require(block.timestamp >= stake.expiresAt, "Stake has not expired yet");
        require(!stake.rewarded, "Stake already resolved");
        require(actualPrice > 0, "Actual price must be greater than 0");
        
        stake.actualPrice = actualPrice;
        stake.rewarded = true;
        
        // Determine if prediction was correct: compare actual vs predicted direction
        bool actualUp = actualPrice > stake.currentPrice;
        bool predictedUp = keccak256(bytes(stake.direction)) == keccak256(bytes("up"));
        stake.predictionCorrect = (actualUp == predictedUp);
        
        // Determine winners: if actual price > current price, "up" stakers win
        bool upWins = actualUp;
                    
        // Calculate total amounts for winners and losers
        uint256 totalWinnersAmount = 0;
        uint256 totalLosersAmount = 0;
        uint256 winnerCount = 0;
        
        uint256[] memory stakerIds = stakeStakers[stakeId];
        
        // First pass: identify winners and calculate totals
        for (uint256 i = 0; i < stakerIds.length; i++) {
            Staker storage staker = stakers[stakerIds[i]];
            bool isWinner = (upWins && staker.stakeUp) || (!upWins && !staker.stakeUp);
            
            if (isWinner) {
                totalWinnersAmount += staker.amountInBNB;
                winnerCount++;
                staker.rewarded = true;
            } else {
                totalLosersAmount += staker.amountInBNB;
            }
        }
        
        // Second pass: distribute rewards to winners
        // Winners get their stake back + proportional share of losers' stakes
        if (winnerCount > 0 && totalWinnersAmount > 0) {
            for (uint256 i = 0; i < stakerIds.length; i++) {
                Staker storage staker = stakers[stakerIds[i]];
                if (staker.rewarded) {
                    // Calculate reward: original stake + proportional share of losers' pool
                    uint256 reward = staker.amountInBNB + (staker.amountInBNB * totalLosersAmount / totalWinnersAmount);
                    
                    // Send reward to winner
                    (bool success, ) = payable(staker.wallet).call{value: reward}("");
                    require(success, "Failed to send reward to winner");
                }
            }
        } else {
            // No winners - return all stakes to stakers (edge case)
            for (uint256 i = 0; i < stakerIds.length; i++) {
                Staker storage staker = stakers[stakerIds[i]];
                (bool success, ) = payable(staker.wallet).call{value: staker.amountInBNB}("");
                require(success, "Failed to return stake");
            }
        }
    }
    
    function resolveStake(uint256 stakeId, uint256 actualPrice) external {
        _resolveStake(stakeId, actualPrice);
    }
    
    struct StakesResponse {
        Stake[] stakes;
        uint256 totalStakes;
        uint256 totalAmountStaked;
    }
    
    function getStakes() external view returns (StakesResponse memory) {
        Stake[] memory allStakes = new Stake[](stakeCount);
        uint256 totalAmount = 0;
        
        for (uint256 i = 1; i <= stakeCount; i++) {
            allStakes[i - 1] = stakes[i];
            
            // Calculate total amount from stakers
            uint256[] memory stakerIds = stakeStakers[i];
            for (uint256 j = 0; j < stakerIds.length; j++) {
                totalAmount += stakers[stakerIds[j]].amountInBNB;
            }
        }
        
        return StakesResponse({
            stakes: allStakes,
            totalStakes: stakeCount,
            totalAmountStaked: totalAmount
        });
    }
    
    // Function for cron jobs to resolve multiple expired stakes at once
    function resolveExpiredStakes(
        uint256[] memory stakeIds,
        uint256[] memory actualPrices
    ) external {
        require(stakeIds.length == actualPrices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            _resolveStake(stakeIds[i], actualPrices[i]);
        }
    }
    
    struct StakeWithStakers {
        Stake stake;
        uint256 stakerCount;
        uint256 totalStakedUp;
        uint256 totalStakedDown;
        Staker[] stakers;
    }
    
    function getStakesWithStakers() external view returns (StakeWithStakers[] memory) {
        StakeWithStakers[] memory stakesWithStakers = new StakeWithStakers[](stakeCount);
        
        for (uint256 i = 1; i <= stakeCount; i++) {
            Stake storage stake = stakes[i];
            uint256[] memory stakerIds = stakeStakers[i];
            
            Staker[] memory stakeStakersList = new Staker[](stakerIds.length);
            uint256 totalUp = 0;
            uint256 totalDown = 0;
            
            for (uint256 j = 0; j < stakerIds.length; j++) {
                stakeStakersList[j] = stakers[stakerIds[j]];
                if (stakers[stakerIds[j]].stakeUp) {
                    totalUp += stakers[stakerIds[j]].amountInBNB;
                } else {
                    totalDown += stakers[stakerIds[j]].amountInBNB;
                }
            }
            
            stakesWithStakers[i - 1] = StakeWithStakers({
                stake: stake,
                stakerCount: stakerIds.length,
                totalStakedUp: totalUp,
                totalStakedDown: totalDown,
                stakers: stakeStakersList
            });
        }
        
        return stakesWithStakers;
    }
    
    function getStakesByCreator(address creator) external view returns (Stake[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= stakeCount; i++) {
            if (stakes[i].createdBy == creator) {
                count++;
            }
        }
        
        Stake[] memory creatorStakes = new Stake[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= stakeCount; i++) {
            if (stakes[i].createdBy == creator) {
                creatorStakes[index] = stakes[i];
                index++;
            }
        }
        
        return creatorStakes;
    }
    
    function stakeOnIt(uint256 stakeId, bool stakeUp) external payable returns (uint256 stakerId) {
        require(msg.value >= MIN_STAKE, "Stake too small");
        require(stakes[stakeId].createdBy != address(0), "Stake does not exist");
        
        stakerCount++;
        stakerId = stakerCount;
        
        Staker storage staker = stakers[stakerId];
        staker.id = stakerId;
        staker.wallet = msg.sender;
        staker.stakeId = stakeId;
        staker.amountInBNB = msg.value;
        staker.createdAt = block.timestamp;
        staker.stakeUp = stakeUp;
        staker.rewarded = false;
        
        stakeStakers[stakeId].push(stakerId);
        
        emit StakerJoined(stakerId, stakeId, msg.sender, msg.value, stakeUp, block.timestamp);
        
        return stakerId;
    }
    
    function getStakersByStake(uint256 stakeId) external view returns (Staker[] memory) {
        uint256[] memory stakerIds = stakeStakers[stakeId];
        Staker[] memory stakeStakersList = new Staker[](stakerIds.length);
        
        for (uint256 i = 0; i < stakerIds.length; i++) {
            stakeStakersList[i] = stakers[stakerIds[i]];
        }
        
        return stakeStakersList;
    }
    
    function getStakerCountByStake(uint256 stakeId) external view returns (uint256) {
        return stakeStakers[stakeId].length;
            }
    
    function getTotalStakedOnStake(uint256 stakeId) external view returns (uint256 totalUp, uint256 totalDown) {
        uint256[] memory stakerIds = stakeStakers[stakeId];
        
        for (uint256 i = 0; i < stakerIds.length; i++) {
            Staker storage staker = stakers[stakerIds[i]];
            if (staker.stakeUp) {
                totalUp += staker.amountInBNB;
            } else {
                totalDown += staker.amountInBNB;
            }
        }
        
        return (totalUp, totalDown);
    }
    
    function getUserStats(address user) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 totalStaked,
        uint256 totalWon,
        uint256 totalLost,
        uint256 winRate
    ) {
        // Loop through all stakes
        for (uint256 i = 1; i <= stakeCount; i++) {
            Stake storage stake = stakes[i];
            uint256[] memory stakerIds = stakeStakers[i];
            
            // Check all stakers for this stake
            for (uint256 j = 0; j < stakerIds.length; j++) {
                Staker storage staker = stakers[stakerIds[j]];
                
                // Only count stakers matching the user
                if (staker.wallet == user) {
                    totalStaked += staker.amountInBNB;
                    
                    // Only count resolved stakes for wins/losses
                    if (stake.rewarded) {
                        if (staker.rewarded) {
                            // Winner - calculate how much they won
                            wins++;
                            // For winners, we need to calculate their reward
                            // This is approximate: original stake + share of losers' pool
                            // We'll use a simplified calculation
                            uint256 totalWinnersAmount = 0;
                            uint256 totalLosersAmount = 0;
        
                            // Calculate totals for this stake
                            for (uint256 k = 0; k < stakerIds.length; k++) {
                                Staker storage s = stakers[stakerIds[k]];
                                if ((stake.actualPrice > stake.currentPrice && s.stakeUp) || 
                                    (stake.actualPrice <= stake.currentPrice && !s.stakeUp)) {
                                    totalWinnersAmount += s.amountInBNB;
                                } else {
                                    totalLosersAmount += s.amountInBNB;
        }
                            }
                            
                            if (totalWinnersAmount > 0) {
                                uint256 reward = staker.amountInBNB + (staker.amountInBNB * totalLosersAmount / totalWinnersAmount);
                                totalWon += reward;
                            } else {
                                totalWon += staker.amountInBNB;
        }
                        } else {
                            // Loser
                            losses++;
                            totalLost += staker.amountInBNB;
                        }
                    }
                }
            }
        }
        
        // Calculate win rate (scaled by 100 for 2 decimals: 6250 = 62.50%)
        if (wins + losses > 0) {
            winRate = (wins * 10000) / (wins + losses);
        }
        
        return (wins, losses, totalStaked, totalWon, totalLost, winRate);
    }
    
    /**
     * Get all correct predictions for a specific crypto
     * Useful for AI to learn from past successful predictions
     */
    function getCorrectPredictionsByCrypto(string memory cryptoId) external view returns (Stake[] memory) {
        uint256 count = 0;
        
        // First pass: count correct predictions for this crypto
        for (uint256 i = 1; i <= stakeCount; i++) {
            Stake storage stake = stakes[i];
            if (keccak256(bytes(stake.cryptoId)) == keccak256(bytes(cryptoId)) && 
                stake.rewarded && 
                stake.predictionCorrect) {
                count++;
            }
        }
        
        // Second pass: collect correct predictions
        Stake[] memory correctStakes = new Stake[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= stakeCount; i++) {
            Stake storage stake = stakes[i];
            if (keccak256(bytes(stake.cryptoId)) == keccak256(bytes(cryptoId)) && 
                stake.rewarded && 
                stake.predictionCorrect) {
                correctStakes[index] = stake;
                index++;
            }
        }
        
        return correctStakes;
    }
}
