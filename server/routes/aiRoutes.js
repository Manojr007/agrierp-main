const express = require('express');
const router = express.Router();
const { getDemandPrediction, getExpiryPrediction, getCreditRisk } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/demand-prediction', protect, getDemandPrediction);
router.get('/expiry-prediction', protect, getExpiryPrediction);
router.get('/credit-risk', protect, getCreditRisk);

module.exports = router;
