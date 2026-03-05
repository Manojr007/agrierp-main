const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    batchNumber: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: [true, 'Invoice number is required'],
            unique: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: [true, 'Supplier is required'],
        },
        items: [purchaseItemSchema],
        subtotal: { type: Number, required: true },
        totalGST: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Bank', 'Credit'],
            default: 'Credit',
        },
        paidAmount: { type: Number, default: 0 },
        purchaseDate: { type: Date, default: Date.now },
        notes: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
