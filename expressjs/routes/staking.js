const express = require('express');
const router = express.Router();
const stakingController = require('../controllers/stakingController');

router.get('/predictions', stakingController.getStakeablePredictions);
router.get('/user/:address', stakingController.getUserStakes);
router.get('/claimable', stakingController.getClaimablePredictions);
router.post('/create-prediction', stakingController.createPredictionAndRegister);

module.exports = router;

