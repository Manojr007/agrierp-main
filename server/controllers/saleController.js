const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
const Counter = require('../models/Counter');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// @desc    Get all sales
// @route   GET /api/sales
exports.getSales = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, customer } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (customer) query.customer = customer;

        const sales = await Sale.find(query)
            .populate('customer', 'name phone village')
            .populate('items.product', 'name category brand')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Sale.countDocuments(query);

        res.json({
            success: true,
            data: sales,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
exports.getSale = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('customer', 'name phone village aadhaar')
            .populate('items.product', 'name category brand unit hsnCode');

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

// @desc    Create sale
// @route   POST /api/sales
exports.createSale = async (req, res, next) => {
    try {
        const { customer, items, paymentMode, paidAmount, discount, notes, saleDate } = req.body;

        // Generate invoice number
        const seq = await Counter.getNextSequence('sale');
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

        let subtotal = 0;
        let totalGST = 0;
        const processedItems = [];

        for (const item of items) {
            const batch = await Batch.findById(item.batch).populate('product');
            if (!batch) {
                return res.status(404).json({ success: false, message: `Batch ${item.batch} not found` });
            }

            if (batch.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.quantity}`,
                });
            }

            const product = await Product.findById(batch.product._id);
            const itemTotal = item.quantity * (item.sellingPrice || batch.sellingPrice);
            const gstAmount = (itemTotal * (product.gstPercent || 0)) / 100;

            // Deduct batch stock
            batch.quantity -= item.quantity;
            await batch.save();

            // Deduct product total stock
            product.totalStock -= item.quantity;
            await product.save();

            processedItems.push({
                product: product._id,
                productName: product.name,
                batch: batch._id,
                batchNumber: batch.batchNumber,
                quantity: item.quantity,
                sellingPrice: item.sellingPrice || batch.sellingPrice,
                gstPercent: product.gstPercent,
                gstAmount: gstAmount,
                totalAmount: itemTotal + gstAmount,
            });

            subtotal += itemTotal;
            totalGST += gstAmount;
        }

        const totalAmount = subtotal + totalGST - (discount || 0);
        const actualPaid = paymentMode === 'Credit' ? 0 : (paidAmount || totalAmount);

        const sale = await Sale.create({
            invoiceNumber,
            customer,
            items: processedItems,
            subtotal,
            totalGST,
            discount: discount || 0,
            totalAmount,
            paymentMode: paymentMode || 'Cash',
            paidAmount: actualPaid,
            saleDate: saleDate || Date.now(),
            notes,
            createdBy: req.user._id,
        });

        // Update customer
        const customerDoc = await Customer.findById(customer);
        if (customerDoc) {
            if (paymentMode === 'Credit') {
                customerDoc.creditBalance += totalAmount;
            }
            customerDoc.totalPurchases += totalAmount;
            await customerDoc.save();
        }

        // Create ledger entry
        if (actualPaid > 0) {
            await Ledger.create({
                type: paymentMode === 'Bank' || paymentMode === 'UPI' ? 'Bank' : 'Cash',
                entryType: 'Credit',
                amount: actualPaid,
                description: `Sale: ${invoiceNumber}`,
                reference: 'Sale',
                referenceId: sale._id,
                party: customerDoc?.name,
                partyId: customer,
                date: saleDate || Date.now(),
                createdBy: req.user._id,
            });
        }

        if (paymentMode === 'Credit') {
            await Ledger.create({
                type: 'Credit',
                entryType: 'Debit',
                amount: totalAmount,
                description: `Credit Sale: ${invoiceNumber}`,
                reference: 'Sale',
                referenceId: sale._id,
                party: customerDoc?.name,
                partyId: customer,
                date: saleDate || Date.now(),
                createdBy: req.user._id,
            });
        }

        const populatedSale = await Sale.findById(sale._id)
            .populate('customer', 'name phone village')
            .populate('items.product', 'name category brand');

        res.status(201).json({ success: true, data: populatedSale });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate sale invoice PDF
// @route   GET /api/sales/:id/invoice
exports.getInvoice = async (req, res, next) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('customer', 'name phone village aadhaar')
            .populate('items.product', 'name category brand unit hsnCode gstPercent');

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        const Company = require('../models/Company');
        const company = await Company.findOne();

        const pdfBuffer = await generateInvoicePDF(sale, company);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${sale.invoiceNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
