import { useState, useEffect } from 'react';
import { getLedgerReportAPI, createLedgerAPI, deleteLedgerAPI } from '../services/api';
import { FiDollarSign, FiPlus, FiFilter, FiDownload, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Accounting = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'Cash',
    entryType: 'Credit',
    amount: '',
    party: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchLedger();
  }, [filter]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const { data } = await getLedgerReportAPI(filter);
      if (data.success) {
        setEntries(data.data.entries);
        setSummary(data.data.summary);
      }
    } catch (error) {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    try {
      const { data } = await createLedgerAPI(newEntry);
      if (data.success) {
        toast.success('Entry created successfully');
        setShowModal(false);
        setNewEntry({
          type: 'Cash', entryType: 'Credit', amount: '',
          party: '', description: '', date: new Date().toISOString().split('T')[0]
        });
        fetchLedger();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create entry');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const { data } = await deleteLedgerAPI(id);
      if (data.success) {
        toast.success('Entry deleted');
        fetchLedger();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="accounting-page">
      <div className="card-header">
        <h2 className="card-title"><FiDollarSign style={{ marginRight: '10px' }} /> General Accounting & Ledger</h2>
        <div className="flex gap-2">
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowModal(true)}><FiPlus /> Manual Entry</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Account Type</label>
            <select className="form-control" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">All Accounts</option>
              <option value="Cash">Cash Account</option>
              <option value="Bank">Bank Account</option>
              <option value="Credit">Credit/Udhari Account</option>
            </select>
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input type="date" className="form-control" value={filter.startDate} onChange={(e) => setFilter({ ...filter, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input type="date" className="form-control" value={filter.endDate} onChange={(e) => setFilter({ ...filter, endDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {summary?.map(s => (
          <div key={s._id} className="card" style={{ flex: 1, margin: 0, borderTop: `4px solid ${s._id === 'Cash' ? '#2e7d32' : s._id === 'Bank' ? '#1976d2' : '#8d6e63'}` }}>
            <h4 style={{ color: '#7f8c8d', fontSize: '0.8rem', textTransform: 'uppercase' }}>{s._id} Balance</h4>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '5px' }}>
              ₹{(s.totalCredit - s.totalDebit).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Party / Description</th>
                <th>Type</th>
                <th className="text-right">Debit (-)</th>
                <th className="text-right">Credit (+)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._id}>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td><span className="badge badge-info">{e.type}</span></td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{e.party}</div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>{e.description}</div>
                  </td>
                  <td>{e.reference}</td>
                  <td className="text-right" style={{ color: '#d32f2f' }}>
                    {e.entryType === 'Debit' ? `₹${e.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="text-right" style={{ color: '#2e7d32' }}>
                    {e.entryType === 'Credit' ? `₹${e.amount.toLocaleString()}` : '-'}
                  </td>
                  <td>
                    <button className="text-red" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }} onClick={() => handleDeleteEntry(e._id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr><td colSpan="7" className="text-center p-8">No ledger entries found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Manual Entry Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="card-title">Add Manual Ledger Entry</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}><FiX /></button>
            </div>
            <form onSubmit={handleCreateEntry} className="p-4">
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Account Type</label>
                  <select className="form-control" value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}>
                    <option value="Cash">Cash Account</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Credit">Credit/Udhari</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Entry Type</label>
                  <select className="form-control" value={newEntry.entryType} onChange={(e) => setNewEntry({ ...newEntry, entryType: e.target.value })}>
                    <option value="Credit">Receipt (+ Credit)</option>
                    <option value="Debit">Payment (- Debit)</option>
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" className="form-control" required value={newEntry.amount} onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" required value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} />
                </div>
              </div>
              <div className="form-group mt-4">
                <label>Party Name (Farmer / Vendor)</label>
                <input type="text" placeholder="e.g. Ramesh Kumar" className="form-control" value={newEntry.party} onChange={(e) => setNewEntry({ ...newEntry, party: e.target.value })} />
              </div>
              <div className="form-group mt-4">
                <label>Description / Notes</label>
                <input type="text" placeholder="Reason for transaction" className="form-control" value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
