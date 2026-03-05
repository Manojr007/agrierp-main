const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product reference is required'],
        },
        batchNumber: {
            type: String,
            required: [true, 'Batch number is required'],
            trim: true,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        manufacturingDate: { type: Date },
        purchasePrice: {
            type: Number,
            required: [true, 'Purchase price is required'],
            min: 0,
        },
        sellingPrice: {
            type: Number,
            required: [true, 'Selling price is required'],
            min: 0,
        },
        mrp: {
            type: Number,
            min: 0,
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0,
        },
        initialQuantity: {
            type: Number,
            min: 0,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
        purchaseRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Purchase',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Virtual: check if expiring within 30 days
batchSchema.virtual('isExpiringSoon').get(function () {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow;
});

batchSchema.virtual('isExpired').get(function () {
    return this.expiryDate <= new Date();
});

batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
