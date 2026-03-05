const Sale = require('../models/Sale');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');

// @desc    Seasonal demand prediction (Kharif: Jun-Oct, Rabi: Nov-Mar)
// @route   GET /api/ai/demand-prediction
exports.getDemandPrediction = async (req, res, next) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        let season, seasonMonths;

        if (currentMonth >= 6 && currentMonth <= 10) {
            season = 'Kharif';
            seasonMonths = [6, 7, 8, 9, 10];
        } else if (currentMonth >= 11 || currentMonth <= 3) {
            season = 'Rabi';
            seasonMonths = [11, 12, 1, 2, 3];
        } else {
            season = 'Zaid';
            seasonMonths = [4, 5];
        }

        // Analyze last 2 years same-season sales
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const seasonalSales = await Sale.aggregate([
            { $match: { saleDate: { $gte: twoYearsAgo } } },
            { $unwind: '$items' },
            {
                $addFields: { month: { $month: '$saleDate' } },
            },
            { $match: { month: { $in: seasonMonths } } },
            {
                $group: {
                    _id: '$items.product',
                    productName: { $first: '$items.productName' },
                    totalQty: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalAmount' },
                    avgQtyPerSale: { $avg: '$items.quantity' },
                    salesCount: { $sum: 1 },
                },
            },
            { $sort: { totalQty: -1 } },
            { $limit: 15 },
        ]);

        // Predict next season demand as 110% of historical average
        const predictions = seasonalSales.map((item) => ({
            product: item.productName || item._id,
            productId: item._id,
            historicalDemand: item.totalQty,
            predictedDemand: Math.ceil(item.totalQty * 1.1),
            avgPerSale: Math.round(item.avgQtyPerSale * 10) / 10,
            confidence: Math.min(95, 50 + item.salesCount * 2),
            recommendedStock: Math.ceil(item.totalQty * 1.2),
        }));

        // Season-specific product recommendations
        const seasonRecommendations = {
            Kharif: ['Rice Seeds', 'Cotton Seeds', 'Soybean Seeds', 'Urea', 'DAP', 'Insecticides'],
            Rabi: ['Wheat Seeds', 'Mustard Seeds', 'Gram Seeds', 'MOP', 'NPK', 'Herbicides'],
            Zaid: ['Watermelon Seeds', 'Cucumber Seeds', 'Moong Seeds', 'Micronutrients'],
        };

        res.json({
            success: true,
            data: {
                currentSeason: season,
                seasonMonths,
                predictions,
                recommendations: seasonRecommendations[season] || [],
                analysis: `Based on ${season} season (${seasonMonths.join(', ')}), predicted 10% growth over last 2 years average.`,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Expiry prediction & risk analysis
// @route   GET /api/ai/expiry-prediction
exports.getExpiryPrediction = async (req, res, next) => {
    try {
        const today = new Date();
        const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        const ninetyDays = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

        const allBatches = await Batch.find({ quantity: { $gt: 0 } })
            .populate('product', 'name category brand unit');

        // Categorize by urgency
        const expired = allBatches.filter((b) => b.expiryDate <= today);
        const critical = allBatches.filter((b) => b.expiryDate > today && b.expiryDate <= thirtyDays);
        const warning = allBatches.filter((b) => b.expiryDate > thirtyDays && b.expiryDate <= sixtyDays);
        const watch = allBatches.filter((b) => b.expiryDate > sixtyDays && b.expiryDate <= ninetyDays);

        // Calculate potential loss
        const calcLoss = (batches) =>
            batches.reduce((sum, b) => sum + b.quantity * b.purchasePrice, 0);

        // Recommended actions
        const recommendations = [
            ...expired.map((b) => ({
                batch: b.batchNumber,
                product: b.product?.name,
                action: 'REMOVE from stock immediately',
                loss: b.quantity * b.purchasePrice,
                urgency: 'critical',
            })),
            ...critical.map((b) => ({
                batch: b.batchNumber,
                product: b.product?.name,
                action: 'Sell at DISCOUNT within 30 days',
                daysLeft: Math.ceil((b.expiryDate - today) / (1000 * 60 * 60 * 24)),
                suggestedDiscount: '20-30%',
                urgency: 'high',
            })),
        ];

        res.json({
            success: true,
            data: {
                summary: {
                    expired: { count: expired.length, potentialLoss: calcLoss(expired) },
                    critical: { count: critical.length, potentialLoss: calcLoss(critical) },
                    warning: { count: warning.length, potentialLoss: calcLoss(warning) },
                    watch: { count: watch.length, potentialLoss: calcLoss(watch) },
                    totalAtRisk: calcLoss([...expired, ...critical, ...warning]),
                },
                expiredBatches: expired.slice(0, 20),
                criticalBatches: critical.slice(0, 20),
                warningBatches: warning.slice(0, 20),
                recommendations: recommendations.slice(0, 20),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Credit risk scoring for farmers
// @route   GET /api/ai/credit-risk
exports.getCreditRisk = async (req, res, next) => {
    try {
        const customers = await Customer.find({ isActive: true });

        const riskAnalysis = await Promise.all(
            customers.map(async (c) => {
                const sales = await Sale.find({ customer: c._id }).sort({ saleDate: -1 }).limit(10);

                // Risk factors
                let riskScore = 0;
                let factors = [];

                // Credit utilization
                const utilization = c.creditLimit > 0 ? (c.creditBalance / c.creditLimit) * 100 : 0;
                if (utilization > 90) { riskScore += 30; factors.push('Credit utilization > 90%'); }
                else if (utilization > 70) { riskScore += 15; factors.push('Credit utilization > 70%'); }

                // Outstanding credit amount
                if (c.creditBalance > 50000) { riskScore += 20; factors.push('High outstanding credit'); }
                else if (c.creditBalance > 20000) { riskScore += 10; factors.push('Moderate outstanding credit'); }

                // Payment history (credit sales ratio)
                const creditSales = sales.filter((s) => s.paymentMode === 'Credit').length;
                const creditRatio = sales.length > 0 ? (creditSales / sales.length) * 100 : 0;
                if (creditRatio > 80) { riskScore += 20; factors.push('Mostly credit purchases'); }
                else if (creditRatio > 50) { riskScore += 10; factors.push('Frequent credit purchases'); }

                // Recency (days since last purchase)
                if (sales.length > 0) {
                    const daysSinceLastPurchase = Math.ceil((new Date() - sales[0].saleDate) / (1000 * 60 * 60 * 24));
                    if (daysSinceLastPurchase > 180) { riskScore += 15; factors.push('No purchase in 6 months'); }
                    else if (daysSinceLastPurchase > 90) { riskScore += 5; factors.push('No purchase in 3 months'); }
                } else {
                    riskScore += 10;
                    factors.push('No purchase history');
                }

                // Total lifetime purchase value
                if (c.totalPurchases < 5000) { riskScore += 10; factors.push('Low total business'); }

                // Determine risk level
                let riskLevel;
                if (riskScore >= 60) riskLevel = 'High';
                else if (riskScore >= 30) riskLevel = 'Medium';
                else riskLevel = 'Low';

                // Recommendation
                let recommendation;
                if (riskLevel === 'High') recommendation = 'Reduce credit limit, request partial payment';
                else if (riskLevel === 'Medium') recommendation = 'Monitor closely, maintain current limit';
                else recommendation = 'Good customer, credit limit can be increased';

                return {
                    customerId: c._id,
                    name: c.name,
                    phone: c.phone,
                    village: c.village,
                    creditBalance: c.creditBalance,
                    creditLimit: c.creditLimit,
                    creditUtilization: Math.round(utilization),
                    totalPurchases: c.totalPurchases,
                    riskScore: Math.min(100, riskScore),
                    riskLevel,
                    factors,
                    recommendation,
                };
            })
        );

        // Sort by risk score descending
        riskAnalysis.sort((a, b) => b.riskScore - a.riskScore);

        const summary = {
            highRisk: riskAnalysis.filter((r) => r.riskLevel === 'High').length,
            mediumRisk: riskAnalysis.filter((r) => r.riskLevel === 'Medium').length,
            lowRisk: riskAnalysis.filter((r) => r.riskLevel === 'Low').length,
            totalOutstandingCredit: riskAnalysis.reduce((sum, r) => sum + r.creditBalance, 0),
        };

        res.json({ success: true, data: { summary, customers: riskAnalysis } });
    } catch (error) {
        next(error);
    }
};
