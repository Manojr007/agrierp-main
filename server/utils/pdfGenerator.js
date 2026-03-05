const PDFDocument = require('pdfkit');

const generateInvoicePDF = (sale, company) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text(company?.name || 'AgriERP', { align: 'center' });
            doc.fontSize(10).font('Helvetica')
                .text(company?.address ? `${company.address.street || ''}, ${company.address.city || ''}, ${company.address.state || ''}` : '', { align: 'center' });
            doc.text(`GST: ${company?.gstNumber || 'N/A'} | Phone: ${company?.phone || ''}`, { align: 'center' });

            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown();

            // Invoice title
            doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
            doc.moveDown(0.5);

            // Invoice details
            const detailsTop = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text(`Invoice No: ${sale.invoiceNumber}`, 50, detailsTop);
            doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString('en-IN')}`, 350, detailsTop);

            doc.moveDown();
            doc.text(`Customer: ${sale.customer?.name || 'N/A'}`, 50);
            doc.text(`Phone: ${sale.customer?.phone || ''}`, 350, doc.y - 12);
            doc.text(`Village: ${sale.customer?.village || ''}`, 50);
            doc.text(`Aadhaar: ${sale.customer?.aadhaar || ''}`, 350, doc.y - 12);

            doc.moveDown();
            doc.text(`Payment Mode: ${sale.paymentMode}`, 50);

            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.5);

            // Table header
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('#', 50, tableTop, { width: 20 });
            doc.text('Product', 70, tableTop, { width: 150 });
            doc.text('Batch', 220, tableTop, { width: 60 });
            doc.text('Qty', 280, tableTop, { width: 40, align: 'right' });
            doc.text('Rate', 325, tableTop, { width: 55, align: 'right' });
            doc.text('GST%', 385, tableTop, { width: 40, align: 'right' });
            doc.text('GST', 430, tableTop, { width: 45, align: 'right' });
            doc.text('Amount', 480, tableTop, { width: 65, align: 'right' });

            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.3);

            // Table rows
            doc.font('Helvetica').fontSize(9);
            sale.items.forEach((item, i) => {
                const y = doc.y;
                doc.text(`${i + 1}`, 50, y, { width: 20 });
                doc.text(item.productName || item.product?.name || '', 70, y, { width: 150 });
                doc.text(item.batchNumber || '', 220, y, { width: 60 });
                doc.text(`${item.quantity}`, 280, y, { width: 40, align: 'right' });
                doc.text(`Rs. ${item.sellingPrice.toFixed(2)}`, 325, y, { width: 55, align: 'right' });
                doc.text(`${item.gstPercent || 0}%`, 385, y, { width: 40, align: 'right' });
                doc.text(`Rs. ${(item.gstAmount || 0).toFixed(2)}`, 430, y, { width: 45, align: 'right' });
                doc.text(`Rs. ${item.totalAmount.toFixed(2)}`, 480, y, { width: 65, align: 'right' });
                doc.moveDown();
            });

            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown();

            // Totals
            const totalsX = 380;
            doc.font('Helvetica').fontSize(10);
            doc.text('Subtotal:', totalsX, doc.y);
            doc.text(`Rs. ${sale.subtotal.toFixed(2)}`, 480, doc.y - 12, { width: 65, align: 'right' });
            doc.moveDown(0.5);

            doc.text('GST:', totalsX);
            doc.text(`Rs. ${sale.totalGST.toFixed(2)}`, 480, doc.y - 12, { width: 65, align: 'right' });
            doc.moveDown(0.5);

            if (sale.discount > 0) {
                doc.text('Discount:', totalsX);
                doc.text(`-Rs. ${sale.discount.toFixed(2)}`, 480, doc.y - 12, { width: 65, align: 'right' });
                doc.moveDown(0.5);
            }

            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('Total:', totalsX);
            doc.text(`Rs. ${sale.totalAmount.toFixed(2)}`, 470, doc.y - 14, { width: 75, align: 'right' });

            doc.moveDown(2);

            // Footer
            doc.font('Helvetica').fontSize(8);
            doc.text('This is a computer-generated invoice.', 50, doc.y, { align: 'center' });
            doc.text('Thank you for your business! | Powered by AgriERP', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoicePDF };
