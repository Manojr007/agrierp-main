import { useState, useEffect } from 'react';
import {
    getCustomersAPI, getProductsAPI, getProductBatchesAPI,
    createSaleAPI, getInvoicePDF, createCustomerAPI
} from '../services/api';
import { FiUser, FiSearch, FiTrash2, FiPlus, FiPrinter, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Sales = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [paidAmount, setPaidAmount] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Search states
    const [custSearch, setCustSearch] = useState('');
    const [prodSearch, setProdSearch] = useState('');
    const [currProdBatches, setCurrProdBatches] = useState([]);

    // Quick add customer
    const [showCustModal, setShowCustModal] = useState(false);
    const [newCust, setNewCust] = useState({ name: '', phone: '', village: '' });

    useEffect(() => {
        if (custSearch.length > 2) fetchCustomers();
        if (prodSearch.length > 2) fetchProducts();
    }, [custSearch, prodSearch]);

    const fetchCustomers = async () => {
        const { data } = await getCustomersAPI({ search: custSearch });
        setCustomers(data.data);
    };

    const fetchProducts = async (isBarcode = false, code = '') => {
        const queryTerm = isBarcode ? code : prodSearch;
        const { data } = await getProductsAPI({ search: queryTerm });

        if (isBarcode && data.data.length === 1) {
            // Exact barcode match - auto add
            addItem(data.data[0]);
            setProdSearch('');
        } else {
            setProducts(data.data);
        }
    };

    const handleProdSearchChange = (val) => {
        setProdSearch(val);
        // Detect if it's likely a barcode scan (usually longer and numeric/alphanumeric entered quickly)
        // For simplicity, if length > 7 and numeric, try auto-fetch
        if (val.length >= 8 && /^\d+$/.test(val)) {
            fetchProducts(true, val);
        }
    };

    const addItem = async (product) => {
        try {
            const { data } = await getProductBatchesAPI(product._id);
            if (data.data.length === 0) {
                toast.warning('No available stock batches for this product');
                return;
            }

            const newItems = [...items, {
                product: product._id,
                productName: product.name,
                batch: data.data[0]._id, // default to first batch for speed
                batchNumber: data.data[0].batchNumber,
                availableBatches: data.data,
                quantity: 1,
                sellingPrice: data.data[0].sellingPrice,
                gstPercent: product.gstPercent,
                totalItemAmount: data.data[0].sellingPrice,
            }];
            setItems(newItems);
            setProdSearch('');
            setProducts([]);
        } catch (error) {
            toast.error('Failed to load batches');
        }
    };

    const updateItemQty = (index, qty) => {
        const newItems = [...items];
        newItems[index].quantity = parseFloat(qty) || 0;
        const itemTotal = newItems[index].quantity * newItems[index].sellingPrice;
        newItems[index].totalItemAmount = itemTotal + (itemTotal * newItems[index].gstPercent / 100);
        setItems(newItems);
    };

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const calculateTotals = () => {
        let subtotal = 0;
        let totalGST = 0;
        items.forEach(item => {
            const itemSub = item.quantity * item.sellingPrice;
            subtotal += itemSub;
            totalGST += (itemSub * item.gstPercent / 100);
        });
        const total = subtotal + totalGST - discount;
        return { subtotal, totalGST, total };
    };

    const { subtotal, totalGST, total } = calculateTotals();

    const handleSaveSale = async (shouldPrint = false) => {
        if (!selectedCustomer) return toast.error('Please select a customer');
        if (items.length === 0) return toast.error('Add at least one item');

        setLoading(true);
        try {
            const { data } = await createSaleAPI({
                customer: selectedCustomer._id,
                items,
                paymentMode,
                paidAmount: paymentMode === 'Credit' ? 0 : paidAmount || total,
                discount,
            });

            if (data.success) {
                toast.success('Sale recorded successfully!');
                if (shouldPrint) await printInvoice(data.data._id);

                // Reset form
                setItems([]);
                setSelectedCustomer(null);
                setDiscount(0);
                setPaidAmount(0);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save sale');
        } finally {
            setLoading(false);
        }
    };

    const printInvoice = async (id) => {
        try {
            const res = await getInvoicePDF(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            toast.error('Failed to generate PDF');
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        try {
            const { data } = await createCustomerAPI(newCust);
            if (data.success) {
                toast.success('Customer added and selected');
                setSelectedCustomer(data.data);
                setShowCustModal(false);
                setNewCust({ name: '', phone: '', village: '' });
                setCustSearch('');
                setCustomers([]);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add customer');
        }
    };

    return (
        <div className="sales-billing">
            <div className="card-header">
                <h2 className="card-title">New Sales Billing</h2>
                <div className="badge badge-success">Invoice Mode</div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem' }}>
                <div className="main-billing">
                    <div className="card mb-4">
                        <h3 className="card-title mb-3" style={{ fontSize: '0.9rem' }}>Farmer / Customer Search</h3>
                        <div className="flex gap-2">
                            <div className="flex-1" style={{ position: 'relative' }}>
                                <div className="form-control flex items-center gap-2">
                                    <FiUser color="#999" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone or village..."
                                        style={{ border: 'none', outline: 'none', width: '100%' }}
                                        value={custSearch}
                                        onChange={(e) => setCustSearch(e.target.value)}
                                    />
                                </div>
                                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} onClick={() => setShowCustModal(true)}>
                                    <FiPlus /> New Farmer
                                </button>
                                {customers.length > 0 && (
                                    <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {customers.map(c => (
                                            <div key={c._id} className="p-3 hover:bg-gray-50 cursor-pointer" style={{ borderBottom: '1px solid #eee' }} onClick={() => { setSelectedCustomer(c); setCustomers([]); setCustSearch(''); }}>
                                                <strong>{c.name}</strong> - {c.phone} ({c.village})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedCustomer && (
                            <div className="mt-3 p-3" style={{ background: '#f1f8e9', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid #c8e6c9' }}>
                                <div>
                                    <strong>Customer:</strong> {selectedCustomer.name} | <strong>Village:</strong> {selectedCustomer.village}
                                </div>
                                <div>
                                    <strong>Balance:</strong> ₹<span style={{ color: selectedCustomer.creditBalance > 0 ? '#d32f2f' : 'inherit' }}>{selectedCustomer.creditBalance}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title" style={{ fontSize: '0.9rem' }}>Items List</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <div className="form-control flex items-center gap-2" style={{ padding: '0.5rem 1rem' }}>
                                    <FiSearch color="#999" />
                                    <input
                                        type="text"
                                        placeholder="Search product or SCAN BARCODE..."
                                        style={{ border: 'none', outline: 'none', width: '100%' }}
                                        value={prodSearch}
                                        onChange={(e) => handleProdSearchChange(e.target.value)}
                                    />
                                </div>
                                {products.length > 0 && (
                                    <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {products.map(p => (
                                            <div key={p._id} className="p-3 hover:bg-gray-50 cursor-pointer" style={{ borderBottom: '1px solid #eee' }} onClick={() => addItem(p)}>
                                                <strong>{p.name}</strong> ({p.brand}) - <span style={{ color: '#2e7d32' }}>Stock: {p.totalStock}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Batch</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Rate</th>
                                        <th className="text-right">GST%</th>
                                        <th className="text-right">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{item.productName}</td>
                                            <td>
                                                <select className="form-control" style={{ padding: '2px 5px', fontSize: '0.8rem' }} value={item.batch} onChange={(e) => {
                                                    const batch = item.availableBatches.find(b => b._id === e.target.value);
                                                    const newItems = [...items];
                                                    newItems[idx].batch = batch._id;
                                                    newItems[idx].batchNumber = batch.batchNumber;
                                                    newItems[idx].sellingPrice = batch.sellingPrice;
                                                    updateItemQty(idx, item.quantity);
                                                }}>
                                                    {item.availableBatches.map(b => (
                                                        <option key={b._id} value={b._id}>{b.batchNumber} (₹{b.sellingPrice})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="text-right">
                                                <input type="number" className="form-control text-right" style={{ width: '70px', padding: '2px 5px' }} value={item.quantity} onChange={(e) => updateItemQty(idx, e.target.value)} min="1" />
                                            </td>
                                            <td className="text-right">₹{item.sellingPrice}</td>
                                            <td className="text-right">{item.gstPercent}%</td>
                                            <td className="text-right" style={{ fontWeight: '600' }}>₹{item.totalItemAmount.toFixed(2)}</td>
                                            <td>
                                                <button className="text-red" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }} onClick={() => removeItem(idx)}>
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center" style={{ padding: '2rem', color: '#999' }}>No items added yet. Search products above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="summary-billing">
                    <div className="card" style={{ position: 'sticky', top: '20px' }}>
                        <h3 className="card-title mb-4">Bill Summary</h3>
                        <div className="summary-row flex justify-between mb-2">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row flex justify-between mb-2" style={{ color: '#2e7d32' }}>
                            <span>Total GST:</span>
                            <span>+ ₹{totalGST.toFixed(2)}</span>
                        </div>
                        <div className="summary-row mb-3 flex items-center justify-between">
                            <span>Discount:</span>
                            <input type="number" className="form-control text-right" style={{ width: '100px', height: '30px' }} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                        </div>
                        <hr className="mb-3" />
                        <div className="summary-total flex justify-between mb-4" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2e7d32' }}>
                            <span>Grand Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        <div className="form-group">
                            <label>Payment Mode</label>
                            <select className="form-control" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI / PhonePe</option>
                                <option value="Credit">Credit (Udhari)</option>
                                <option value="Bank">Bank Transfer</option>
                            </select>
                        </div>

                        {paymentMode !== 'Credit' && (
                            <div className="form-group">
                                <label>Paid Amount</label>
                                <input type="number" className="form-control" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                        )}

                        <div className="flex flex-col gap-2 mt-4">
                            <button className="btn btn-primary" onClick={() => handleSaveSale(true)} disabled={loading}>
                                <FiPrinter /> Save & Print Invoice
                            </button>
                            <button className="btn btn-outline" onClick={() => handleSaveSale(false)} disabled={loading} style={{ border: '1px solid #ddd' }}>
                                <FiSave /> Save Only (No Print)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Customer Modal */}
            {showCustModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%' }}>
                        <div className="card-header">
                            <h3 className="card-title">Quick Add New Customer</h3>
                        </div>
                        <form onSubmit={handleQuickAdd} className="p-4">
                            <div className="form-group">
                                <label>Farmer Name</label>
                                <input type="text" className="form-control" required value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" className="form-control" required value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Village</label>
                                <input type="text" className="form-control" required value={newCust.village} onChange={(e) => setNewCust({ ...newCust, village: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setShowCustModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save & Select</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center;
                    justify-content: center; z-index: 1000;
                }
            `}</style>
        </div>
    );
};

export default Sales;
