import { useState, useEffect } from 'react';
import {
    getSuppliersAPI, createSupplierAPI, updateSupplierAPI,
    deleteSupplierAPI
} from '../services/api';
import { FiPlus, FiSearch, FiEdit2, FiTruck, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [formData, setFormData] = useState({ companyName: '', contactPerson: '', phone: '', gstNumber: '', address: { city: '', state: '' } });

    useEffect(() => {
        fetchSuppliers();
    }, [search]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const { data } = await getSuppliersAPI({ search });
            setSuppliers(data.data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedSupplier) {
                await updateSupplierAPI(selectedSupplier._id, formData);
                toast.success('Supplier updated');
            } else {
                await createSupplierAPI(formData);
                toast.success('Supplier added');
            }
            setShowModal(false);
            setSelectedSupplier(null);
            fetchSuppliers();
        } catch (error) {
            toast.error('Failed to save supplier');
        }
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            companyName: supplier.companyName,
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            gstNumber: supplier.gstNumber || '',
            address: supplier.address || { city: '', state: '' }
        });
        setShowModal(true);
    };

    return (
        <div className="suppliers-page">
            <div className="card-header">
                <h2 className="card-title">Supplier Directory</h2>
                <button className="btn btn-primary" onClick={() => { setSelectedSupplier(null); setFormData({ companyName: '', contactPerson: '', phone: '', gstNumber: '', address: { city: '', state: '' } }); setShowModal(true); }}>
                    <FiPlus /> Add Supplier
                </button>
            </div>

            <div className="card mb-4">
                <div className="flex items-center gap-2 p-2">
                    <FiSearch color="#7f8c8d" />
                    <input
                        type="text"
                        placeholder="Search by company name or contact person..."
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
                                <th>Company Name</th>
                                <th>Contact Person</th>
                                <th>GST Number</th>
                                <th>Outstanding Payable</th>
                                <th>Total Business</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ fontWeight: '600' }}>
                                        <div className="flex items-center gap-2">
                                            <FiTruck color="#8d6e63" />
                                            {s.companyName}
                                        </div>
                                    </td>
                                    <td>{s.contactPerson}</td>
                                    <td><code style={{ fontSize: '0.8rem' }}>{s.gstNumber}</code></td>
                                    <td className="text-right" style={{ color: s.outstandingPayable > 0 ? '#d32f2f' : 'inherit', fontWeight: '700' }}>
                                        ₹{s.outstandingPayable.toLocaleString('en-IN')}
                                    </td>
                                    <td className="text-right">₹{s.totalPurchases.toLocaleString('en-IN')}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(s)}><FiEdit2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="auth-card" style={{ maxWidth: '600px' }}>
                        <h3 className="mb-4">{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input type="text" className="form-control" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
                            </div>
                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input type="text" className="form-control" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>GST Number</label>
                                <input type="text" className="form-control" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
                            </div>
                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" className="form-control" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input type="text" className="form-control" value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1">Save Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
