import { useState, useEffect } from 'react';
import {
    getProfitLossAPI, getStockValuationAPI,
    getLedgerReportAPI
} from '../services/api';
import {
    FiFileText, FiPieChart, FiBarChart, FiDollarSign,
    FiDownload, FiSearch, FiPrinter
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('pl'); // pl, stock, ledger
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [dates, setDates] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReportData();
    }, [activeTab]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'pl') res = await getProfitLossAPI(dates);
            else if (activeTab === 'stock') res = await getStockValuationAPI();
            else res = await getLedgerReportAPI(dates);

            setData(res.data.data);
        } catch (error) {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reports-page">
            <div className="card-header">
                <h2 className="card-title">Business Reports & Ledger</h2>
                <div className="flex gap-2">
                    <button className={`btn ${activeTab === 'pl' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('pl')}>Profit & Loss</button>
                    <button className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('stock')}>Stock Valuation</button>
                    <button className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('ledger')}>General Ledger</button>
                </div>
            </div>

            <div className="card mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>From:</label>
                            <input type="date" className="form-control" value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} style={{ padding: '5px 10px' }} />
                        </div>
                        <div className="flex items-center gap-2">
                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>To:</label>
                            <input type="date" className="form-control" value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} style={{ padding: '5px 10px' }} />
                        </div>
                        <button className="btn btn-primary" onClick={fetchReportData} style={{ padding: '5px 15px' }}><FiSearch /> Run Report</button>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '5px 15px' }} onClick={() => window.print()}><FiPrinter /> Print</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-8">
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p className="mt-4">Generating report data...</p>
                </div>
            ) : (
                <div className="report-content">
                    {activeTab === 'pl' && data && (
                        <div className="pl-report">
                            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="card" style={{ background: '#e8f5e9' }}>
                                    <h3 style={{ color: '#2e7d32', marginBottom: '1.5rem' }}>Incomes</h3>
                                    <div className="flex justify-between mb-4">
                                        <span>Total Sales (Taxable):</span>
                                        <span style={{ fontWeight: '700' }}>₹{data.revenue?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between mb-4">
                                        <span>GST Collected (Output):</span>
                                        <span style={{ fontWeight: '700' }}>₹{data.gstCollected?.toLocaleString()}</span>
                                    </div>
                                    <hr style={{ margin: '1rem 0', borderColor: '#c8e6c9' }} />
                                    <div className="flex justify-between" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                        <span>Total Income:</span>
                                        <span>₹{(data.revenue + data.gstCollected).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="card" style={{ background: '#fff5f5' }}>
                                    <h3 style={{ color: '#d32f2f', marginBottom: '1.5rem' }}>Expenses / Purchases</h3>
                                    <div className="flex justify-between mb-4">
                                        <span>Total Purchases (Taxable):</span>
                                        <span style={{ fontWeight: '700' }}>₹{data.costOfGoods?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between mb-4">
                                        <span>GST Paid (Input):</span>
                                        <span style={{ fontWeight: '700' }}>₹{data.gstPaid?.toLocaleString()}</span>
                                    </div>
                                    <hr style={{ margin: '1rem 0', borderColor: '#ffcdd2' }} />
                                    <div className="flex justify-between" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                                        <span>Total Outflow:</span>
                                        <span>₹{(data.costOfGoods + data.gstPaid).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card mt-4" style={{ textAlign: 'center', background: data.grossProfit >= 0 ? '#f1f8e9' : '#ffebee' }}>
                                <h2 style={{ fontSize: '2rem', color: data.grossProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>
                                    {data.grossProfit >= 0 ? 'Net Profit: ' : 'Net Loss: '}
                                    ₹{Math.abs(data.grossProfit).toLocaleString()}
                                </h2>
                                <p style={{ color: '#7f8c8d' }}>Performance for period: {new Date(data.period?.start).toLocaleDateString()} to {new Date(data.period?.end).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && data && (
                        <div className="stock-report card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="card-title">Stock Valuation Summary</h3>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Total Value (at Purchase):</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2e7d32' }}>₹{data.totalStockValue?.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Batch</th>
                                            <th className="text-right">Quantity</th>
                                            <th className="text-right">Pur Price</th>
                                            <th className="text-right">Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '600' }}>{item.product}</td>
                                                <td>{item.category}</td>
                                                <td><code>{item.batchNumber}</code></td>
                                                <td className="text-right">{item.quantity}</td>
                                                <td className="text-right">₹{item.purchasePrice}</td>
                                                <td className="text-right" style={{ fontWeight: '700' }}>₹{item.stockValue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ledger' && data && (
                        <div className="ledger-report card">
                            <div className="flex gap-4 mb-6">
                                {data.summary?.map(s => (
                                    <div key={s._id} className="p-4" style={{ flex: 1, background: '#f8f9fa', borderRadius: '12px', borderLeft: '4px solid #1976d2' }}>
                                        <h4 style={{ color: '#1976d2', marginBottom: '5px' }}>{s._id} Ledger</h4>
                                        <div className="flex justify-between">
                                            <span>Credit In: <span style={{ color: '#2e7d32' }}>₹{s.totalCredit?.toLocaleString()}</span></span>
                                            <span>Debit Out: <span style={{ color: '#d32f2f' }}>₹{s.totalDebit?.toLocaleString()}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Ledger</th>
                                            <th>Party / Details</th>
                                            <th>Reference</th>
                                            <th className="text-right">Debit (Out)</th>
                                            <th className="text-right">Credit (In)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.entries?.map((e, idx) => (
                                            <tr key={idx}>
                                                <td>{new Date(e.date).toLocaleDateString()}</td>
                                                <td><span className="badge badge-info">{e.type}</span></td>
                                                <td><strong>{e.party || '-'}</strong><br /><small>{e.description}</small></td>
                                                <td>{e.reference}</td>
                                                <td className="text-right" style={{ color: '#d32f2f' }}>{e.entryType === 'Debit' ? `₹${e.amount.toLocaleString()}` : ''}</td>
                                                <td className="text-right" style={{ color: '#2e7d32' }}>{e.entryType === 'Credit' ? `₹${e.amount.toLocaleString()}` : ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
