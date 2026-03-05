const express = require('express');
const router = express.Router();
const { getSales, getSale, createSale, getInvoice } = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getSales)
    .post(protect, createSale);

router.route('/:id')
    .get(protect, getSale);

router.get('/:id/invoice', protect, getInvoice);

module.exports = router;
