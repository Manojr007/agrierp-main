const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Batch = require('../models/Batch');
const Ledger = require('../models/Ledger');

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
exports.getDashboard = async (req, res, next) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Total sales this month
        const monthlySales = await Sale.aggregate([
            { $match: { saleDate: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        // Total purchases this month
        const monthlyPurchases = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        // Total sales this year
        const yearlySales = await Sale.aggregate([
            { $match: { saleDate: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Total purchases this year
        const yearlyPurchases = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        // Low stock count
        const lowStockCount = await Product.countDocuments({
            $expr: { $lte: ['$totalStock', '$lowStockThreshold'] },
            isActive: true,
        });

        // Expiring batches count (30 days)
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        const expiringCount = await Batch.countDocuments({
            expiryDate: { $lte: thirtyDays },
            quantity: { $gt: 0 },
        });

        // Top selling products (this month)
        const topProducts = await Sale.aggregate([
            { $match: { saleDate: { $gte: startOfMonth } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    productName: { $first: '$items.productName' },
                    totalQty: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalAmount' },
                },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
        ]);

        // Top customers
        const topCustomers = await Sale.aggregate([
            { $match: { saleDate: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: '$customer',
                    totalPurchases: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { totalPurchases: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' },
        ]);

        // Monthly sales trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const salesTrend = await Sale.aggregate([
            { $match: { saleDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Total customers and outstanding credit
        const customerStats = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalCredit: { $sum: '$creditBalance' },
                },
            },
        ]);

        // Stock summary by category
        const stockSummary = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$totalStock' },
                },
            },
        ]);

        const totalSalesMonth = monthlySales[0]?.total || 0;
        const totalPurchasesMonth = monthlyPurchases[0]?.total || 0;

        res.json({
            success: true,
            data: {
                monthlySales: { total: totalSalesMonth, count: monthlySales[0]?.count || 0 },
                monthlyPurchases: { total: totalPurchasesMonth, count: monthlyPurchases[0]?.count || 0 },
                monthlyProfit: totalSalesMonth - totalPurchasesMonth,
                yearlySales: yearlySales[0]?.total || 0,
                yearlyPurchases: yearlyPurchases[0]?.total || 0,
                lowStockCount,
                expiringCount,
                topProducts,
                topCustomers,
                salesTrend,
                customerStats: customerStats[0] || { totalCustomers: 0, totalCredit: 0 },
                stockSummary,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Profit & Loss statement
// @route   GET /api/reports/profit-loss
exports.getProfitLoss = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate) end.setHours(23, 59, 59, 999);

        const salesTotal = await Sale.aggregate([
            { $match: { saleDate: { $gte: start, $lte: end } } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' }, gst: { $sum: '$totalGST' } } },
        ]);

        const purchaseTotal = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: start, $lte: end } } },
            { $group: { _id: null, cost: { $sum: '$totalAmount' }, gst: { $sum: '$totalGST' } } },
        ]);

        const revenue = salesTotal[0]?.revenue || 0;
        const cost = purchaseTotal[0]?.cost || 0;
        const salesGST = salesTotal[0]?.gst || 0;
        const purchaseGST = purchaseTotal[0]?.gst || 0;

        res.json({
            success: true,
            data: {
                period: { start, end },
                revenue,
                costOfGoods: cost,
                grossProfit: revenue - cost,
                gstCollected: salesGST,
                gstPaid: purchaseGST,
                netGST: salesGST - purchaseGST,
                netProfit: revenue - cost,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Stock valuation report
// @route   GET /api/reports/stock-valuation
exports.getStockValuation = async (req, res, next) => {
    try {
        const batches = await Batch.find({ quantity: { $gt: 0 } })
            .populate('product', 'name category brand unit');

        let totalValue = 0;
        const valuation = batches.map((b) => {
            const value = b.quantity * b.purchasePrice;
            totalValue += value;
            return {
                product: b.product?.name,
                category: b.product?.category,
                brand: b.product?.brand,
                batchNumber: b.batchNumber,
                quantity: b.quantity,
                purchasePrice: b.purchasePrice,
                sellingPrice: b.sellingPrice,
                stockValue: value,
                potentialRevenue: b.quantity * b.sellingPrice,
                expiryDate: b.expiryDate,
            };
        });

        res.json({
            success: true,
            data: { items: valuation, totalStockValue: totalValue, totalItems: valuation.length },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Monthly sales report
// @route   GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate) end.setHours(23, 59, 59, 999);

        const sales = await Sale.find({ saleDate: { $gte: start, $lte: end } })
            .populate('customer', 'name phone village')
            .sort({ saleDate: -1 });

        const summary = await Sale.aggregate([
            { $match: { saleDate: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    totalGST: { $sum: '$totalGST' },
                    count: { $sum: 1 },
                    cashSales: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'Cash'] }, '$totalAmount', 0] },
                    },
                    creditSales: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'Credit'] }, '$totalAmount', 0] },
                    },
                    upiSales: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'UPI'] }, '$totalAmount', 0] },
                    },
                },
            },
        ]);

        res.json({
            success: true,
            data: { sales, summary: summary[0] || {}, period: { start, end } },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Purchase report
// @route   GET /api/reports/purchases
exports.getPurchaseReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        const purchases = await Purchase.find({ purchaseDate: { $gte: start, $lte: end } })
            .populate('supplier', 'companyName')
            .sort({ purchaseDate: -1 });

        const summary = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    totalGST: { $sum: '$totalGST' },
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            success: true,
            data: { purchases, summary: summary[0] || {}, period: { start, end } },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Ledger report
// @route   GET /api/reports/ledger
exports.getLedgerReport = async (req, res, next) => {
    try {
        const { type, startDate, endDate } = req.query;
        let query = {};

        if (type) query.type = type;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const entries = await Ledger.find(query).sort({ date: -1 });

        const summary = await Ledger.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$type',
                    totalDebit: {
                        $sum: { $cond: [{ $eq: ['$entryType', 'Debit'] }, '$amount', 0] },
                    },
                    totalCredit: {
                        $sum: { $cond: [{ $eq: ['$entryType', 'Credit'] }, '$amount', 0] },
                    },
                },
            },
        ]);

        res.json({ success: true, data: { entries, summary } });
    } catch (error) {
        next(error);
    }
};
