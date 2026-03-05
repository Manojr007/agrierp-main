const express = require('express');
const router = express.Router();
const {
    getDashboard, getProfitLoss, getStockValuation,
    getSalesReport, getPurchaseReport, getLedgerReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboard);
router.get('/profit-loss', protect, getProfitLoss);
router.get('/stock-valuation', protect, getStockValuation);
router.get('/sales', protect, getSalesReport);
router.get('/purchases', protect, getPurchaseReport);
router.get('/ledger', protect, getLedgerReport);

module.exports = router;
