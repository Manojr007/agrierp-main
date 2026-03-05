const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
        },
        village: { type: String, trim: true },
        district: { type: String, trim: true },
        state: { type: String, trim: true, default: 'Maharashtra' },
        aadhaar: {
            type: String,
            match: [/^\d{12}$/, 'Aadhaar must be 12 digits'],
        },
        creditBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        creditLimit: {
            type: Number,
            default: 50000,
        },
        totalPurchases: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

customerSchema.index({ name: 'text', phone: 'text', village: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
