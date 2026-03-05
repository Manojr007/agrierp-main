const Ledger = require('../models/Ledger');

// @desc    Create manual ledger entry
// @route   POST /api/ledger
exports.createLedgerEntry = async (req, res, next) => {
    try {
        const { type, entryType, amount, party, description, date } = req.body;

        const entry = await Ledger.create({
            type,
            entryType,
            amount,
            party,
            description,
            date: date || Date.now(),
            reference: 'Adjustment',
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete ledger entry
// @route   DELETE /api/ledger/:id
exports.deleteLedgerEntry = async (req, res, next) => {
    try {
        const entry = await Ledger.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Entry not found' });
        }

        // Optional: Prevent deleting system-generated entries (Sale/Purchase)
        // if (['Sale', 'Purchase'].includes(entry.reference)) {
        //     return res.status(400).json({ success: false, message: 'Cannot delete system-generated entries directly' });
        // }

        await entry.deleteOne();
        res.json({ success: true, message: 'Entry deleted' });
    } catch (error) {
        next(error);
    }
};
