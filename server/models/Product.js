const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Seed', 'Fertilizer', 'Pesticide', 'Equipment', 'Other'],
        },
        brand: {
            type: String,
            required: [true, 'Brand is required'],
            trim: true,
        },
        hsnCode: {
            type: String,
            trim: true,
        },
        barcode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        gstPercent: {
            type: Number,
            required: [true, 'GST percentage is required'],
            enum: [0, 5, 12, 18, 28],
        },
        unit: {
            type: String,
            default: 'Kg',
            enum: ['Kg', 'Litre', 'Packet', 'Bag', 'Bottle', 'Piece', 'Quintal', 'Ton'],
        },
        description: { type: String, trim: true },
        purchasePrice: {
            type: Number,
            default: 0,
        },
        sellingPrice: {
            type: Number,
            default: 0,
        },
        totalStock: {
            type: Number,
            default: 0,
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', brand: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
