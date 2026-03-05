/**
 * GST Calculator for Agriculture Products
 * In India, agriculture inputs have specific GST rates:
 * - Seeds: 0% or 5%
 * - Fertilizers: 5%
 * - Pesticides: 18%
 * - Equipment: 12% or 18%
 */

const calculateGST = (amount, gstPercent) => {
    const gstAmount = (amount * gstPercent) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
        baseAmount: amount,
        gstPercent,
        gstAmount: Math.round(gstAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        totalAmount: Math.round((amount + gstAmount) * 100) / 100,
    };
};

const calculateItemGST = (quantity, price, gstPercent) => {
    const baseAmount = quantity * price;
    return calculateGST(baseAmount, gstPercent);
};

const getDefaultGSTRate = (category) => {
    const rates = {
        Seed: 0,
        Fertilizer: 5,
        Pesticide: 18,
        Equipment: 12,
        Other: 18,
    };
    return rates[category] || 18;
};

module.exports = { calculateGST, calculateItemGST, getDefaultGSTRate };
