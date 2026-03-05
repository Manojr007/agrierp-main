const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');
const Ledger = require('../models/Ledger');
const Counter = require('../models/Counter');

// @desc    Get all purchases
// @route   GET /api/purchases
exports.getPurchases = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.purchaseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const purchases = await Purchase.find(query)
            .populate('supplier', 'companyName gstNumber')
            .populate('items.product', 'name category brand')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Purchase.countDocuments(query);

        res.json({
            success: true,
            data: purchases,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
exports.getPurchase = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('supplier', 'companyName gstNumber address')
            .populate('items.product', 'name category brand unit');

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        res.json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

// @desc    Create purchase
// @route   POST /api/purchases
exports.createPurchase = async (req, res, next) => {
    try {
        const { supplier, items, paymentMode, paidAmount, notes, purchaseDate } = req.body;

        // Generate invoice number
        const seq = await Counter.getNextSequence('purchase');
        const invoiceNumber = `PUR-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
            }

            const itemTotal = item.quantity * item.purchasePrice;
            const gstAmount = (itemTotal * (product.gstPercent || 0)) / 100;

            // Create batch
            const batch = await Batch.create({
                product: item.product,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                manufacturingDate: item.manufacturingDate,
                purchasePrice: item.purchasePrice,
                sellingPrice: item.sellingPrice,
                mrp: item.mrp,
                quantity: item.quantity,
                initialQuantity: item.quantity,
                supplier: supplier,
            });

            // Update product total stock
            product.totalStock += item.quantity;
            await product.save();

            processedItems.push({
                product: item.product,
                batch: batch._id,
                batchNumber: item.batchNumber,
                quantity: item.quantity,
                purchasePrice: item.purchasePrice,
                sellingPrice: item.sellingPrice,
                expiryDate: item.expiryDate,
                gstPercent: product.gstPercent,
                gstAmount: gstAmount,
                totalAmount: itemTotal + gstAmount,
            });

            subtotal += itemTotal;
            totalGST += gstAmount;
        }

        const totalAmount = subtotal + totalGST;

        const purchase = await Purchase.create({
            invoiceNumber,
            supplier,
            items: processedItems,
            subtotal,
            totalGST,
            totalAmount,
            paymentMode: paymentMode || 'Credit',
            paidAmount: paidAmount || 0,
            purchaseDate: purchaseDate || Date.now(),
            notes,
            createdBy: req.user._id,
        });

        // Update supplier outstanding
        const supplierDoc = await Supplier.findById(supplier);
        if (supplierDoc) {
            const creditAmount = totalAmount - (paidAmount || 0);
            supplierDoc.outstandingPayable += creditAmount;
            supplierDoc.totalPurchases += totalAmount;
            await supplierDoc.save();
        }

        // Create ledger entry
        if (paidAmount > 0) {
            await Ledger.create({
                type: paymentMode === 'Bank' ? 'Bank' : 'Cash',
                entryType: 'Debit',
                amount: paidAmount,
                description: `Purchase: ${invoiceNumber}`,
                reference: 'Purchase',
                referenceId: purchase._id,
                party: supplierDoc?.companyName,
                partyId: supplier,
                date: purchaseDate || Date.now(),
                createdBy: req.user._id,
            });
        }

        const populatedPurchase = await Purchase.findById(purchase._id)
            .populate('supplier', 'companyName')
            .populate('items.product', 'name category brand');

        res.status(201).json({ success: true, data: populatedPurchase });
    } catch (error) {
        next(error);
    }
};
