import { useState, useEffect } from 'react';
import {
    getCustomersAPI, createCustomerAPI, updateCustomerAPI,
    deleteCustomerAPI, getCustomerHistoryAPI
} from '../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiClock, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', village: '', aadhaar: '', creditLimit: 50000 });

    // History view
    const [historyCustomer, setHistoryCustomer] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await getCustomersAPI({ search });
            setCustomers(data.data);
        } catch (error) {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedCustomer) {
                await updateCustomerAPI(selectedCustomer._id, formData);
                toast.success('Customer updated');
            } else {
                await createCustomerAPI(formData);
                toast.success('Customer created');
            }
            setShowModal(false);
            setSelectedCustomer(null);
            setFormData({ name: '', phone: '', village: '', aadhaar: '', creditLimit: 50000 });
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to save customer');
        }
    };

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            village: customer.village,
            aadhaar: customer.aadhaar || '',
            creditLimit: customer.creditLimit
        });
        setShowModal(true);
    };

    const handleViewHistory = async (customer) => {
        try {
            const { data } = await getCustomerHistoryAPI(customer._id);
            setHistory(data.data.transactions);
            setHistoryCustomer(data.data.customer);
        } catch (error) {
            toast.error('Failed to load history');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this farmer? This will also remove their history.')) {
            try {
                await deleteCustomerAPI(id);
                toast.success('Customer deleted');
                fetchCustomers();
            } catch (error) {
                toast.error('Failed to delete customer');
            }
        }
    };

    return (
        <div className="customers-page">
            <div className="card-header">
                <h2 className="card-title">Farmer / Customer Directory</h2>
                <button className="btn btn-primary" onClick={() => { setSelectedCustomer(null); setFormData({ name: '', phone: '', village: '', aadhaar: '', creditLimit: 50000 }); setShowModal(true); }}>
                    <FiPlus /> New Farmer
                </button>
            </div>

            <div className="card mb-4">
                <div className="flex items-center gap-2 p-2">
                    <FiSearch color="#7f8c8d" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or village..."
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
                                <th>Farmer Name</th>
                                <th>Phone</th>
                                <th>Village</th>
                                <th>Aadhaar</th>
                                <th className="text-right">Credit Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c._id}>
                                    <td style={{ fontWeight: '600' }}>{c.name}</td>
                                    <td>{c.phone}</td>
                                    <td>{c.village}</td>
                                    <td>{c.aadhaar || '-'}</td>
                                    <td className="text-right">
                                        <span style={{ color: c.creditBalance > 0 ? '#d32f2f' : 'inherit', fontWeight: '700' }}>
                                            ₹{c.creditBalance.toLocaleString('en-IN')}
                                        </span>
                                    </td>
                                    <td className="flex gap-2">
                                        <button className="btn btn-sm btn-outline" title="Edit" onClick={() => handleEdit(c)}><FiEdit2 /></button>
                                        <button className="btn btn-sm btn-outline" title="View History" onClick={() => handleViewHistory(c)}><FiClock /></button>
                                        <button className="btn btn-sm btn-outline" title="Delete" style={{ color: '#d32f2f' }} onClick={() => handleDelete(c._id)}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="auth-card" style={{ maxWidth: '500px' }}>
                        <h3 className="mb-4">{selectedCustomer ? 'Edit Farmer' : 'Add New Farmer'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Farmer Name</label>
                                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Village</label>
                                    <input type="text" className="form-control" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Aadhaar Number (Optional)</label>
                                <input type="text" className="form-control" value={formData.aadhaar} onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Credit Limit (₹)</label>
                                <input type="number" className="form-control" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })} />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Save Farmer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {historyCustomer && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div className="card-header">
                            <h3 className="card-title">Transaction History: {historyCustomer.name}</h3>
                            <button className="btn btn-sm btn-outline" onClick={() => setHistoryCustomer(null)}>Close</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Date</th>
                                        <th>Mode</th>
                                        <th className="text-right">Total</th>
                                        <th className="text-right">Paid</th>
                                        <th className="text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h) => (
                                        <tr key={h._id}>
                                            <td style={{ fontWeight: '600' }}>{h.invoiceNumber}</td>
                                            <td>{new Date(h.saleDate).toLocaleDateString()}</td>
                                            <td><span className={`badge ${h.paymentMode === 'Credit' ? 'badge-warning' : 'badge-success'}`}>{h.paymentMode}</span></td>
                                            <td className="text-right">₹{h.totalAmount.toLocaleString()}</td>
                                            <td className="text-right">₹{h.paidAmount.toLocaleString()}</td>
                                            <td className="text-right" style={{ color: h.totalAmount - h.paidAmount > 0 ? '#d32f2f' : 'inherit' }}>
                                                ₹{(h.totalAmount - h.paidAmount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan="6" className="text-center p-4">No transactions found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
