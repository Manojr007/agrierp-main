import { useState, useEffect } from 'react';
import {
    getDemandPredictionAPI, getExpiryPredictionAPI,
    getCreditRiskAPI
} from '../services/api';
import {
    FiCpu, FiTrendingUp, FiAlertTriangle, FiShield,
    FiCalendar, FiArrowRight, FiCheckCircle
} from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { toast } from 'react-toastify';

const AIInsights = () => {
    const [demandData, setDemandData] = useState(null);
    const [expiryData, setExpiryData] = useState(null);
    const [creditData, setCreditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('demand'); // demand, expiry, credit

    useEffect(() => {
        fetchAIData();
    }, []);

    const fetchAIData = async () => {
        setLoading(true);
        try {
            const [demandRes, expiryRes, creditRes] = await Promise.all([
                getDemandPredictionAPI(),
                getExpiryPredictionAPI(),
                getCreditRiskAPI()
            ]);
            setDemandData(demandRes.data.data);
            setExpiryData(expiryRes.data.data);
            setCreditData(creditRes.data.data);
        } catch (error) {
            toast.error('Failed to load AI predictions');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Generating AI Insights...</p></div>;

    return (
        <div className="ai-insights-page">
            <div className="card-header">
                <h2 className="card-title"><FiCpu style={{ marginRight: '10px' }} /> AI & Smart Predictions</h2>
                <div className="flex gap-2">
                    <button className={`btn ${activeTab === 'demand' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('demand')}>Demand Forecasting</button>
                    <button className={`btn ${activeTab === 'expiry' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('expiry')}>Expiry Risk</button>
                    <button className={`btn ${activeTab === 'credit' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('credit')}>Credit Risk</button>
                </div>
            </div>

            {activeTab === 'demand' && (
                <div className="ai-content">
                    <div className="flex items-center gap-2 mb-6 p-4" style={{ background: '#e8f5e9', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                        <FiCalendar size={24} color="#2e7d32" />
                        <div>
                            <p style={{ fontWeight: '700', color: '#2e7d32' }}>Current Season: {demandData?.currentSeason}</p>
                            <p style={{ fontSize: '0.85rem' }}>Analyzing demand for months: {demandData?.seasonMonths?.join(', ')}</p>
                        </div>
                    </div>

                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                        <div className="card">
                            <h3 className="card-title mb-4">Predicted Sales Demand vs Historical</h3>
                            <div style={{ height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demandData?.predictions || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="product" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem' }} interval={0} angle={-45} textAnchor="end" height={80} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="historicalDemand" name="Past Season Qty" fill="#8d6e63" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="predictedDemand" name="Predicted Qty" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="card-title mb-4">Stock Recommendations</h3>
                            {demandData?.predictions?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 mb-2" style={{ background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.product}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Confidence: {item.confidence}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2e7d32' }}>Buy {item.recommendedStock} units</p>
                                        <p style={{ fontSize: '0.7rem' }}>Avg: {item.avgPerSale}/sale</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'expiry' && (
                <div className="ai-content">
                    <div className="stats-grid mb-6">
                        <div className="stat-card" style={{ borderBottom: '4px solid #d32f2f' }}>
                            <div className="stat-icon" style={{ background: '#ffeeee', color: '#d32f2f' }}><FiAlertTriangle /></div>
                            <div className="stat-info">
                                <h3>Expired Value</h3>
                                <div className="stat-value">₹{expiryData?.summary?.expired?.potentialLoss?.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderBottom: '4px solid #fbc02d' }}>
                            <div className="stat-icon" style={{ background: '#fff9e6', color: '#fbc02d' }}><FiAlertTriangle /></div>
                            <div className="stat-info">
                                <h3>Critical Risk (30d)</h3>
                                <div className="stat-value">₹{expiryData?.summary?.critical?.potentialLoss?.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ borderBottom: '4px solid #1976d2' }}>
                            <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}><FiAlertTriangle /></div>
                            <div className="stat-info">
                                <h3>Warning (60d)</h3>
                                <div className="stat-value">₹{expiryData?.summary?.warning?.potentialLoss?.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">AI Recommended Disposal Actions</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Batch</th>
                                        <th>Urgency</th>
                                        <th>Recommended Action</th>
                                        <th className="text-right">Potential Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiryData?.recommendations?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>{item.product}</td>
                                            <td><code>{item.batch}</code></td>
                                            <td>
                                                <span className={`badge ${item.urgency === 'critical' ? 'badge-error' : 'badge-warning'}`}>
                                                    {item.urgency.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FiArrowRight color="#2e7d32" />
                                                    <span>{item.action}</span>
                                                </div>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: '700' }}>₹{item.loss?.toLocaleString() || '-'}</td>
                                        </tr>
                                    ))}
                                    {expiryData?.recommendations?.length === 0 && (
                                        <tr><td colSpan="5" className="text-center p-4">Excellent! No expiry risks detected.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'credit' && (
                <div className="ai-content">
                    <div className="stats-grid mb-6">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f' }}><FiShield /></div>
                            <div className="stat-info">
                                <h3>High Risk Farmers</h3>
                                <div className="stat-value">{creditData?.summary?.highRisk}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(56, 142, 60, 0.1)', color: '#2e7d32' }}><FiCheckCircle /></div>
                            <div className="stat-info">
                                <h3>Good Customers</h3>
                                <div className="stat-value">{creditData?.summary?.lowRisk}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}><FiDollarSign /></div>
                            <div className="stat-info">
                                <h3>Total Credits</h3>
                                <div className="stat-value">₹{creditData?.summary?.totalOutstandingCredit?.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">Farmer Credit Risk Scoring</h3>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Farmer Name</th>
                                        <th>Balance</th>
                                        <th>Utilization</th>
                                        <th>Risk Score</th>
                                        <th>Level</th>
                                        <th>AI Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditData?.customers?.map((c, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: '600' }}>
                                                {c.name}
                                                <br /><small style={{ color: '#999' }}>{c.village}</small>
                                            </td>
                                            <td>₹{c.creditBalance.toLocaleString()}</td>
                                            <td>
                                                <div style={{ width: '100%', background: '#eee', height: '6px', borderRadius: '3px', marginTop: '5px' }}>
                                                    <div style={{
                                                        width: `${c.creditUtilization}%`,
                                                        background: c.creditUtilization > 80 ? '#d32f2f' : c.creditUtilization > 50 ? '#fbc02d' : '#2e7d32',
                                                        height: '100%', borderRadius: '3px'
                                                    }}></div>
                                                </div>
                                                <small>{c.creditUtilization}%</small>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', color: c.riskScore > 60 ? '#d32f2f' : c.riskScore > 30 ? '#fbc02d' : '#2e7d32' }}>
                                                    {c.riskScore}/100
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.riskLevel === 'High' ? 'badge-error' : c.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                                                    {c.riskLevel}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>"{c.recommendation}"</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIInsights;
