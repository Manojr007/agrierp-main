const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, 'Supplier company name is required'],
            trim: true,
        },
        contactPerson: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        gstNumber: {
            type: String,
            uppercase: true,
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
        },
        outstandingPayable: {
            type: Number,
            default: 0,
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

module.exports = mongoose.model('Supplier', supplierSchema);
