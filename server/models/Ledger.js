const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['Cash', 'Bank', 'Credit'],
            required: [true, 'Ledger type is required'],
        },
        entryType: {
            type: String,
            enum: ['Debit', 'Credit'],
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: 0,
        },
        description: { type: String, trim: true },
        reference: {
            type: String,
            enum: ['Sale', 'Purchase', 'Payment', 'Receipt', 'Adjustment'],
        },
        referenceId: { type: mongoose.Schema.Types.ObjectId },
        party: { type: String, trim: true },
        partyId: { type: mongoose.Schema.Types.ObjectId },
        balance: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

ledgerSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
