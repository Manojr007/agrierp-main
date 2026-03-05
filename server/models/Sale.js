const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
});

const saleSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required'],
        },
        items: [saleItemSchema],
        subtotal: { type: Number, required: true },
        totalGST: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Credit', 'UPI', 'Bank'],
            default: 'Cash',
        },
        paidAmount: { type: Number, default: 0 },
        saleDate: { type: Date, default: Date.now },
        notes: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
