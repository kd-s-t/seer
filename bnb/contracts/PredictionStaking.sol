// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredictionStaking {
    struct Prediction {
        address predictor;
        string cryptoId;
        uint256 currentPrice;
        uint256 predictedPrice;
        uint256 actualPrice;
        uint256 timestamp;
        bool verified;
        uint256 accuracy;
        string direction;
        uint256 percentChange;
    }
    
    struct Stake {
        address staker;
        uint256 predictionId;
        uint256 amount;
        uint256 timestamp;
        bool rewarded;
        bool stakeUp;
    }
    
    struct PredictionStakeInfo {
        uint256 totalStaked;
        uint256 totalStakedUp;
        uint256 totalStakedDown;
        uint256 stakeCount;
        uint256 uniqueStakerCount;
        mapping(address => bool) hasStaked;
        mapping(address => uint256) userStakesUp;
        mapping(address => uint256) userStakesDown;
        mapping(uint256 => Stake) stakes;
    }
    
    uint256 public predictionCount;
    mapping(uint256 => Prediction) public predictions;
    mapping(address => uint256) public userAccuracy;
    mapping(address => uint256) public userPredictionCount;
    mapping(uint256 => PredictionStakeInfo) public predictionStakes;
    mapping(address => uint256[]) public userStakedPredictions;
    mapping(uint256 => uint256) public predictionExpiry;
    mapping(uint256 => bool) public rewardsDistributed;
    
    uint256 public constant PREDICTION_WINDOW = 48 hours;
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MIN_ACCURACY_FOR_REWARD = 50;
    
    event PredictionRecorded(
        uint256 indexed predictionId,
        address indexed predictor,
        string cryptoId,
        uint256 currentPrice,
        uint256 predictedPrice,
        uint256 timestamp
    );
    
    event PredictionVerified(
        uint256 indexed predictionId,
        uint256 actualPrice,
        uint256 accuracy
    );
    
    event StakePlaced(
        uint256 indexed predictionId,
        address indexed staker,
        uint256 amount,
        bool stakeUp,
        uint256 timestamp
    );
    
    event RewardsDistributed(
        uint256 indexed predictionId,
        uint256 totalRewards,
        uint256 stakerCount
    );
    
    function recordPrediction(
        string memory cryptoId,
        uint256 currentPrice,
        uint256 predictedPrice,
        string memory direction,
        uint256 percentChange
    ) external returns (uint256 predictionId) {
        predictionCount++;
        predictionId = predictionCount;
        
        Prediction storage prediction = predictions[predictionId];
        prediction.predictor = msg.sender;
        prediction.cryptoId = cryptoId;
        prediction.currentPrice = currentPrice;
        prediction.predictedPrice = predictedPrice;
        prediction.timestamp = block.timestamp;
        prediction.verified = false;
        prediction.accuracy = 0;
        prediction.direction = direction;
        prediction.percentChange = percentChange;
        
        userPredictionCount[msg.sender]++;
        
        uint256 expiresAt = block.timestamp + PREDICTION_WINDOW;
        predictionExpiry[predictionId] = expiresAt;
        
        emit PredictionRecorded(
            predictionId,
            msg.sender,
            cryptoId,
            currentPrice,
            predictedPrice,
            block.timestamp
        );
        
        return predictionId;
    }
    
    function verifyPrediction(
        uint256 predictionId,
        uint256 actualPrice
    ) external {
        Prediction storage prediction = predictions[predictionId];
        require(prediction.predictor != address(0), "Prediction does not exist");
        require(!prediction.verified, "Prediction already verified");
        
        prediction.actualPrice = actualPrice;
        prediction.verified = true;
        
        uint256 priceDiff;
        if (actualPrice > prediction.predictedPrice) {
            priceDiff = actualPrice - prediction.predictedPrice;
        } else {
            priceDiff = prediction.predictedPrice - actualPrice;
        }
        
        uint256 accuracy = 100;
        if (prediction.predictedPrice > 0) {
            uint256 errorPercent = (priceDiff * 100) / prediction.predictedPrice;
            if (errorPercent > 100) {
                accuracy = 0;
            } else {
                accuracy = 100 - errorPercent;
            }
        }
        
        prediction.accuracy = accuracy;
        
        address predictor = prediction.predictor;
        uint256 totalPredictions = userPredictionCount[predictor];
        uint256 currentAvg = userAccuracy[predictor];
        
        uint256 newAvg = ((currentAvg * (totalPredictions - 1)) + accuracy) / totalPredictions;
        userAccuracy[predictor] = newAvg;
        
        emit PredictionVerified(predictionId, actualPrice, accuracy);
    }
    
    function getPrediction(uint256 predictionId) external view returns (
        address predictor,
        string memory cryptoId,
        uint256 currentPrice,
        uint256 predictedPrice,
        uint256 actualPrice,
        uint256 timestamp,
        bool verified,
        uint256 accuracy,
        string memory direction,
        uint256 percentChange
    ) {
        Prediction storage prediction = predictions[predictionId];
        require(prediction.predictor != address(0), "Prediction does not exist");
        
        return (
            prediction.predictor,
            prediction.cryptoId,
            prediction.currentPrice,
            prediction.predictedPrice,
            prediction.actualPrice,
            prediction.timestamp,
            prediction.verified,
            prediction.accuracy,
            prediction.direction,
            prediction.percentChange
        );
    }
    
    function stakeOnPrediction(uint256 predictionId, bool stakeUp) external payable {
        require(msg.value >= MIN_STAKE, "Stake too small");
        require(block.timestamp < predictionExpiry[predictionId], "Prediction expired");
        require(predictionExpiry[predictionId] > 0, "Prediction does not exist");
        
        PredictionStakeInfo storage stakeInfo = predictionStakes[predictionId];
        
        if (stakeInfo.userStakesUp[msg.sender] == 0 && stakeInfo.userStakesDown[msg.sender] == 0) {
            userStakedPredictions[msg.sender].push(predictionId);
        }
        
        if (!stakeInfo.hasStaked[msg.sender]) {
            stakeInfo.hasStaked[msg.sender] = true;
            stakeInfo.uniqueStakerCount++;
        }
        
        if (stakeUp) {
            stakeInfo.userStakesUp[msg.sender] += msg.value;
            stakeInfo.totalStakedUp += msg.value;
        } else {
            stakeInfo.userStakesDown[msg.sender] += msg.value;
            stakeInfo.totalStakedDown += msg.value;
        }
        
        stakeInfo.totalStaked += msg.value;
        
        Stake memory newStake = Stake({
            staker: msg.sender,
            predictionId: predictionId,
            amount: msg.value,
            timestamp: block.timestamp,
            rewarded: false,
            stakeUp: stakeUp
        });
        
        stakeInfo.stakes[stakeInfo.stakeCount] = newStake;
        stakeInfo.stakeCount++;
        
        emit StakePlaced(predictionId, msg.sender, msg.value, stakeUp, block.timestamp);
    }
    
    function registerPrediction(uint256 predictionId, uint256 expiresAt) external {
        require(predictionExpiry[predictionId] == 0, "Prediction already registered");
        require(expiresAt > block.timestamp, "Invalid expiry time");
        
        predictionExpiry[predictionId] = expiresAt;
    }
    
    function claimRewards(uint256 predictionId) external {
        require(predictionExpiry[predictionId] > 0, "Prediction does not exist");
        require(block.timestamp >= predictionExpiry[predictionId], "Prediction not expired yet");
        require(!rewardsDistributed[predictionId], "Rewards already distributed");
        
        Prediction storage prediction = predictions[predictionId];
        require(prediction.verified, "Prediction not yet verified");
        require(prediction.accuracy >= MIN_ACCURACY_FOR_REWARD, "Prediction not accurate enough");
        
        PredictionStakeInfo storage stakeInfo = predictionStakes[predictionId];
        require(stakeInfo.totalStaked > 0, "No stakes to reward");
        
        bool upWins = prediction.actualPrice >= prediction.predictedPrice;
        uint256 winningPool = upWins ? stakeInfo.totalStakedUp : stakeInfo.totalStakedDown;
        uint256 losingPool = upWins ? stakeInfo.totalStakedDown : stakeInfo.totalStakedUp;
        
        require(winningPool > 0, "No winning stakers");
        require(losingPool > 0, "No losing stakers to distribute from");
        
        rewardsDistributed[predictionId] = true;
        
        for (uint256 i = 0; i < stakeInfo.stakeCount; i++) {
            Stake storage stake = stakeInfo.stakes[i];
            if (!stake.rewarded && stake.amount > 0 && stake.stakeUp == upWins) {
                uint256 reward = (losingPool * stake.amount) / winningPool;
                if (reward > 0) {
                    uint256 totalReward = stake.amount + reward;
                    payable(stake.staker).transfer(totalReward);
                    stake.rewarded = true;
                }
            }
        }
        
        emit RewardsDistributed(predictionId, losingPool, stakeInfo.stakeCount);
    }
    
    function isExpired(uint256 predictionId) external view returns (bool) {
        return block.timestamp >= predictionExpiry[predictionId];
    }
    
    function getUserStakedPredictions(address user) external view returns (uint256[] memory) {
        return userStakedPredictions[user];
    }
    
    function getPredictionExpiry(uint256 predictionId) external view returns (uint256) {
        return predictionExpiry[predictionId];
    }
}
