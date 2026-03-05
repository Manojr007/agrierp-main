const express = require('express');
const router = express.Router();
const { createLedgerEntry, deleteLedgerEntry } = require('../controllers/ledgerController');
const { protect } = require('../middleware/auth');

router.route('/')
    .post(protect, createLedgerEntry);

router.route('/:id')
    .delete(protect, deleteLedgerEntry);

module.exports = router;
