import { useState, useEffect } from 'react';
import {
    getSuppliersAPI, getProductsAPI, createPurchaseAPI
} from '../services/api';
import { FiTruck, FiSearch, FiPlus, FiTrash2, FiSave, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Purchases = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [paymentMode, setPaymentMode] = useState('Credit');
    const [paidAmount, setPaidAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [supSearch, setSupSearch] = useState('');
    const [prodSearch, setProdSearch] = useState('');

    useEffect(() => {
        if (supSearch.length > 2) fetchSuppliers();
        if (prodSearch.length > 2) fetchProducts();
    }, [supSearch, prodSearch]);

    const fetchSuppliers = async () => {
        const { data } = await getSuppliersAPI({ search: supSearch });
        setSuppliers(data.data);
    };

    const fetchProducts = async () => {
        const { data } = await getProductsAPI({ search: prodSearch });
        setProducts(data.data);
    };

    const addItem = (product) => {
        const defaultExpiry = new Date();
        defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);

        setItems([...items, {
            product: product._id,
            productName: product.name,
            batchNumber: '',
            quantity: 1,
            purchasePrice: 0,
            sellingPrice: 0,
            mrp: 0,
            expiryDate: defaultExpiry.toISOString().split('T')[0],
            total: 0
        }]);
        setProdSearch('');
        setProducts([]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'purchasePrice') {
            newItems[index].total = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].purchasePrice) || 0);
        }
        setItems(newItems);
    };

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleSavePurchase = async () => {
        if (!selectedSupplier) return toast.error('Select a supplier');
        if (items.length === 0) return toast.error('Add at least one item');

        // Simple validation
        for (const item of items) {
            if (!item.batchNumber) return toast.error(`Batch number required for ${item.productName}`);
            if (item.quantity <= 0) return toast.error(`Quantity must be > 0 for ${item.productName}`);
        }

        setLoading(true);
        try {
            const { data } = await createPurchaseAPI({
                supplier: selectedSupplier._id,
                items,
                paymentMode,
                paidAmount: paymentMode === 'Credit' ? 0 : paidAmount || subtotal,
            });

            if (data.success) {
                toast.success('Purchase entry successful! Stock updated.');
                setItems([]);
                setSelectedSupplier(null);
                setPaidAmount(0);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save purchase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="purchase-entry">
            <div className="card-header">
                <h2 className="card-title">New Purchase Entry</h2>
                <div className="badge badge-warning">Stock Inward</div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                <div className="main-content-p">
                    <div className="card mb-4">
                        <h3 className="card-title mb-3" style={{ fontSize: '0.9rem' }}>Supplier Details</h3>
                        <div style={{ position: 'relative' }}>
                            <div className="form-control flex items-center gap-2">
                                <FiTruck color="#999" />
                                <input
                                    type="text"
                                    placeholder="Search supplier..."
                                    style={{ border: 'none', outline: 'none', width: '100%' }}
                                    value={supSearch}
                                    onChange={(e) => setSupSearch(e.target.value)}
                                />
                            </div>
                            {suppliers.length > 0 && (
                                <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    {suppliers.map(s => (
                                        <div key={s._id} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedSupplier(s); setSuppliers([]); setSupSearch(''); }}>
                                            <strong>{s.companyName}</strong> - {s.gstNumber}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedSupplier && (
                            <div className="mt-3 p-3 bg-gray-50" style={{ borderRadius: '8px', border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                                <span><strong>Supplier:</strong> {selectedSupplier.companyName}</span>
                                <span><strong>Payable:</strong> ₹{selectedSupplier.outstandingPayable.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="card-title" style={{ fontSize: '0.9rem' }}>Purchase Items</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <div className="form-control flex items-center gap-2">
                                    <FiSearch color="#999" />
                                    <input
                                        type="text"
                                        placeholder="Search product to add..."
                                        style={{ border: 'none', outline: 'none', width: '100%' }}
                                        value={prodSearch}
                                        onChange={(e) => setProdSearch(e.target.value)}
                                    />
                                </div>
                                {products.length > 0 && (
                                    <div className="dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        {products.map(p => (
                                            <div key={p._id} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => addItem(p)}>
                                                <strong>{p.name}</strong> ({p.brand})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="table-container">
                            <table style={{ minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Batch #</th>
                                        <th>Exp Date</th>
                                        <th className="text-right">Qty</th>
                                        <th className="text-right">Pur Price</th>
                                        <th className="text-right">Sell Price</th>
                                        <th className="text-right">Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600', fontSize: '0.8rem' }}>{item.productName}</td>
                                            <td><input type="text" className="form-control" style={{ padding: '4px', fontSize: '0.8rem' }} value={item.batchNumber} onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)} placeholder="B123" /></td>
                                            <td><input type="date" className="form-control" style={{ padding: '2px', fontSize: '0.75rem' }} value={item.expiryDate} onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)} /></td>
                                            <td className="text-right"><input type="number" className="form-control text-right" style={{ width: '60px', padding: '4px' }} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                                            <td className="text-right"><input type="number" className="form-control text-right" style={{ width: '80px', padding: '4px' }} value={item.purchasePrice} onChange={(e) => updateItem(idx, 'purchasePrice', e.target.value)} /></td>
                                            <td className="text-right"><input type="number" className="form-control text-right" style={{ width: '80px', padding: '4px' }} value={item.sellingPrice} onChange={(e) => updateItem(idx, 'sellingPrice', e.target.value)} /></td>
                                            <td className="text-right" style={{ fontWeight: '700' }}>₹{item.total.toFixed(2)}</td>
                                            <td><button className="text-red" style={{ background: 'none', border: 'none', color: '#d32f2f' }} onClick={() => removeItem(idx)}><FiTrash2 /></button></td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr><td colSpan="8" className="text-center p-4">No items added. Search products to begin.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="summary-side">
                    <div className="card" style={{ position: 'sticky', top: '20px' }}>
                        <h3 className="card-title mb-4">Total Bill</h3>
                        <div className="flex justify-between mb-4" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#8d6e63' }}>
                            <span>Grand Total:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="form-group">
                            <label>Payment Mode</label>
                            <select className="form-control" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="Credit">Credit (Outstanding)</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                            </select>
                        </div>

                        {paymentMode !== 'Credit' && (
                            <div className="form-group">
                                <label>Amount Paid</label>
                                <input type="number" className="form-control" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                        )}

                        <button className="btn btn-primary mt-4" style={{ background: '#8d6e63' }} onClick={handleSavePurchase} disabled={loading}>
                            <FiCheckCircle /> Record Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Purchases;
