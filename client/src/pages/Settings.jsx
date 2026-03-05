import { useState, useEffect } from 'react';
import { getCompanyAPI, updateCompanyAPI } from '../services/api';
import { FiSettings, FiSave, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Settings = () => {
    const [formData, setFormData] = useState({
        name: '',
        gstNumber: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', pincode: '' },
        financialYearStart: '',
        financialYearEnd: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const { data } = await getCompanyAPI();
            if (data.success) {
                const company = data.data;
                setFormData({
                    ...company,
                    financialYearStart: company.financialYearStart?.split('T')[0] || '',
                    financialYearEnd: company.financialYearEnd?.split('T')[0] || ''
                });
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await updateCompanyAPI(formData);
            if (data.success) {
                toast.success('Company settings updated');
            }
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading Settings...</p></div>;

    return (
        <div className="settings-page">
            <div className="card-header">
                <h2 className="card-title"><FiSettings style={{ marginRight: '10px' }} /> Company Settings</h2>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <h3 className="mb-4" style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Basic Information</h3>
                        <div className="form-group">
                            <label>Company Name</label>
                            <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>GST Number</label>
                                <input type="text" className="form-control" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} required />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>

                        <h3 className="mb-4 mt-6" style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Address Details</h3>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input type="text" className="form-control" value={formData.address?.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} />
                        </div>
                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>City</label>
                                <input type="text" className="form-control" value={formData.address?.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input type="text" className="form-control" value={formData.address?.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input type="text" className="form-control" value={formData.address?.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} />
                            </div>
                        </div>

                        <h3 className="mb-4 mt-6" style={{ fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Financial Settings</h3>
                        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Financial Year Start</label>
                                <input type="date" className="form-control" value={formData.financialYearStart} onChange={(e) => setFormData({ ...formData, financialYearStart: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Financial Year End</label>
                                <input type="date" className="form-control" value={formData.financialYearEnd} onChange={(e) => setFormData({ ...formData, financialYearEnd: e.target.value })} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '12px 30px' }}><FiSave /> Save All Changes</button>
                        </div>
                    </form>
                </div>

                <div className="help-side">
                    <div className="card" style={{ background: '#f1f8e9', border: '1px solid #c8e6c9' }}>
                        <h3 className="flex items-center gap-2 mb-4" style={{ color: '#2e7d32' }}><FiInfo /> Configuration Tips</h3>
                        <ul style={{ fontSize: '0.9rem', paddingLeft: '20px' }}>
                            <li className="mb-2">Ensure your **GST Number** is correct for valid tax invoices.</li>
                            <li className="mb-2">The **Financial Year** settings affect your P&L and Sales reports.</li>
                            <li className="mb-2">These details will appear on the top of your **Generated PDFs**.</li>
                            <li className="mb-2">Only Admins can change company settings.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
