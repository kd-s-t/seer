const express = require('express');
const router = express.Router();
const tradingController = require('../controllers/tradingController');

// router.post('/buy', tradingController.buyCrypto);
// router.post('/sell', tradingController.sellCrypto);
router.get('/account', tradingController.getAccount);
router.get('/price', tradingController.getPrice);

module.exports = router;

