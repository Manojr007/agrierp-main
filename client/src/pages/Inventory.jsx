import { useState, useEffect } from 'react';
import {
    getProductsAPI, getLowStockAPI, getExpiringAPI,
    createProductAPI, getProductBatchesAPI, updateProductAPI
} from '../services/api';
import { FiPlus, FiAlertCircle, FiSearch, FiPackage, FiInfo, FiEdit2, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [view, setView] = useState('all'); // all, low-stock, expiring
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', category: 'Fertilizer', brand: '', hsnCode: '',
        gstPercent: 12, unit: 'Kg', lowStockThreshold: 10, barcode: '',
        purchasePrice: 0, sellingPrice: 0
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [batches, setBatches] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchData();
    }, [view, search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            if (view === 'low-stock') res = await getLowStockAPI();
            else if (view === 'expiring') res = await getExpiringAPI();
            else res = await getProductsAPI({ search });

            if (res.data.success) {
                setProducts(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const { data } = await createProductAPI(newProduct);
            if (data.success) {
                toast.success('Product added successfully');
                setShowAddModal(false);
                setNewProduct({
                    name: '', category: 'Fertilizer', brand: '', hsnCode: '',
                    gstPercent: 12, unit: 'Kg', lowStockThreshold: 10, barcode: '',
                    purchasePrice: 0, sellingPrice: 0
                });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add product');
        }
    };

    const handleUpdateProduct = async (id) => {
        try {
            const { data } = await updateProductAPI(id, editForm);
            if (data.success) {
                toast.success('Product updated');
                setEditingId(null);
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        }
    };

    const startEditing = (p) => {
        setEditingId(p._id);
        setEditForm({
            name: p.name || '',
            brand: p.brand || '',
            category: p.category || 'Fertilizer',
            barcode: p.barcode || '',
            totalStock: p.totalStock || 0,
            purchasePrice: p.purchasePrice || 0,
            sellingPrice: p.sellingPrice || 0,
            isActive: p.isActive !== undefined ? p.isActive : true
        });
    };

    const handleUpdateStatus = async (product, newStatus) => {
        try {
            // Mapping "In Stock" to isActive: true and "Out of Stock" to isActive: false
            const isActive = newStatus === 'In Stock';
            const { data } = await updateProductAPI(product._id, { isActive });
            if (data.success) {
                toast.success(`Status updated for ${product.name}`);
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleViewBatches = async (product) => {
        try {
            const { data } = await getProductBatchesAPI(product._id);
            if (data.success) {
                setBatches(data.data);
                setSelectedProduct(product);
            }
        } catch (error) {
            toast.error('Failed to load batches');
        }
    };

    return (
        <div className="inventory-page">
            <div className="card-header">
                <h2 className="card-title">Inventory Management</h2>
                <div className="flex gap-2">
                    <button className={`btn btn-outline ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>All Products</button>
                    <button className={`btn btn-outline ${view === 'low-stock' ? 'active' : ''}`} onClick={() => setView('low-stock')}>Low Stock</button>
                    <button className={`btn btn-outline ${view === 'expiring' ? 'active' : ''}`} onClick={() => setView('expiring')}>Expiring Soon</button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><FiPlus /> New Product</button>
                </div>
            </div>

            <div className="card mb-4">
                <div className="flex items-center gap-2 p-2">
                    <FiSearch color="#7f8c8d" />
                    <input
                        type="text"
                        placeholder="Search products by name, brand or barcode..."
                        className="form-control"
                        style={{ border: 'none', boxShadow: 'none' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Brand</th>
                                <th>Barcode</th>
                                <th className="text-right">Rate (Sale)</th>
                                <th>Quantity</th>
                                <th>Total Stock</th>
                                <th>GST%</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p._id}>
                                    <td>
                                        {editingId === p._id ? (
                                            <input type="text" className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                        ) : (
                                            <span style={{ fontWeight: '600' }}>{p.name}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p._id ? (
                                            <select className="form-control" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                                                <option value="Seed">Seed</option>
                                                <option value="Fertilizer">Fertilizer</option>
                                                <option value="Pesticide">Pesticide</option>
                                                <option value="Equipment">Equipment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : (
                                            <span className="badge badge-info">{p.category}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p._id ? (
                                            <input type="text" className="form-control" value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
                                        ) : (
                                            p.brand
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p._id ? (
                                            <input type="text" className="form-control" value={editForm.barcode} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} />
                                        ) : (
                                            <code style={{ fontSize: '0.8rem' }}>{p.barcode || '-'}</code>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p._id ? (
                                            <input type="number" className="form-control" style={{ width: '80px' }} value={editForm.sellingPrice} onChange={(e) => setEditForm({ ...editForm, sellingPrice: parseFloat(e.target.value) || 0 })} />
                                        ) : (
                                            <div style={{ fontWeight: '600' }}>₹{p.sellingPrice || 0}</div>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p._id ? (
                                            <input type="number" className="form-control" style={{ width: '80px' }} value={editForm.totalStock} onChange={(e) => setEditForm({ ...editForm, totalStock: parseFloat(e.target.value) || 0 })} />
                                        ) : (
                                            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#2c3e50' }}>{p.totalStock}</div>
                                        )}
                                    </td>
                                    <td>{p.totalStock} {p.unit}</td>
                                    <td>{p.gstPercent}%</td>
                                    <td>
                                        <select
                                            className="form-control"
                                            style={{
                                                width: '120px',
                                                padding: '4px 8px',
                                                fontSize: '0.8rem',
                                                borderRadius: '20px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                color: 'white',
                                                backgroundColor: (editingId === p._id ? editForm.isActive : p.isActive) ? '#2e7d32' : '#d32f2f'
                                            }}
                                            value={(editingId === p._id ? editForm.isActive : p.isActive) ? 'In Stock' : 'Out of Stock'}
                                            onChange={(e) => {
                                                const val = e.target.value === 'In Stock';
                                                if (editingId === p._id) setEditForm({ ...editForm, isActive: val });
                                                else handleUpdateStatus(p, e.target.value);
                                            }}
                                        >
                                            <option value="In Stock" style={{ backgroundColor: 'white', color: 'black' }}>In Stock</option>
                                            <option value="Out of Stock" style={{ backgroundColor: 'white', color: 'black' }}>Out of Stock</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            {editingId === p._id ? (
                                                <>
                                                    <button className="btn btn-sm btn-primary" style={{ padding: '0.4rem' }} onClick={() => handleUpdateProduct(p._id)} title="Save"><FiSave /></button>
                                                    <button className="btn btn-sm btn-outline" style={{ padding: '0.4rem' }} onClick={() => setEditingId(null)} title="Cancel">X</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn btn-sm btn-outline" style={{ padding: '0.4rem' }} onClick={() => startEditing(p)} title="Edit"><FiEdit2 /></button>
                                                    <button className="btn btn-sm btn-outline" style={{ padding: '0.4rem' }} onClick={() => handleViewBatches(p)} title="View Batches"><FiInfo /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="10" className="text-center" style={{ padding: '3rem' }}>
                                        <FiPackage size={40} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
                                        <p>No products found in inventory</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="card modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="card-header">
                            <h3 className="card-title">Add New Product</h3>
                        </div>
                        <form onSubmit={handleAddProduct} className="p-4">
                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input type="text" className="form-control" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Brand / Manufacturer</label>
                                    <input type="text" className="form-control" required value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        <option value="Seed">Seed</option>
                                        <option value="Fertilizer">Fertilizer</option>
                                        <option value="Pesticide">Pesticide</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Barcode / EAN</label>
                                    <input type="text" className="form-control" placeholder="Scan or type barcode" value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select className="form-control" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                                        <option value="Kg">Kg</option>
                                        <option value="Litre">Litre</option>
                                        <option value="Packet">Packet</option>
                                        <option value="Bag">Bag</option>
                                        <option value="Bottle">Bottle</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>GST Percentage</label>
                                    <select className="form-control" value={newProduct.gstPercent} onChange={(e) => setNewProduct({ ...newProduct, gstPercent: parseInt(e.target.value) })}>
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>HSN Code</label>
                                    <input type="text" className="form-control" value={newProduct.hsnCode} onChange={(e) => setNewProduct({ ...newProduct, hsnCode: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Low Stock Alert At</label>
                                    <input type="number" className="form-control" value={newProduct.lowStockThreshold} onChange={(e) => setNewProduct({ ...newProduct, lowStockThreshold: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Purchase Price (₹)</label>
                                    <input type="number" className="form-control" value={newProduct.purchasePrice} onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>Selling Price (₹)</label>
                                    <input type="number" className="form-control" value={newProduct.sellingPrice} onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <div className="modal-overlay">
                    <div className="card modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="card-header">
                            <h3 className="card-title">Batches for {selectedProduct.name}</h3>
                            <button className="btn btn-sm" onClick={() => setSelectedProduct(null)}>Close</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Batch #</th>
                                        <th>Expiry</th>
                                        <th>Purchase ₹</th>
                                        <th>Selling ₹</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map((b) => (
                                        <tr key={b._id}>
                                            <td>{b.batchNumber}</td>
                                            <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                                            <td>₹{b.purchasePrice}</td>
                                            <td>₹{b.sellingPrice}</td>
                                            <td>{b.quantity}</td>
                                            <td>
                                                {new Date(b.expiryDate) < new Date() ? (
                                                    <span className="badge badge-error">Expired</span>
                                                ) : b.quantity === 0 ? (
                                                    <span className="badge badge-warning">Out of Stock</span>
                                                ) : (
                                                    <span className="badge badge-success">Available</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        }
        .modal-content { background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
        .btn-outline { background: white; border: 1px solid var(--border); }
        .btn-outline.active { background: var(--primary); color: white; border-color: var(--primary); }
        .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
      `}</style>
        </div>
    );
};

export default Inventory;
