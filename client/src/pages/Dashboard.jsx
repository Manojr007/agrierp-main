import { useState, useEffect } from 'react';
import { getDashboardAPI } from '../services/api';
import {
    FiShoppingCart, FiShoppingBag, FiTrendingUp,
    FiAlertTriangle, FiUsers, FiDollarSign
} from 'react-icons/fi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await getDashboardAPI();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading Dashboard...</p></div>;

    const COLORS = ['#2e7d32', '#4caf50', '#8d6e63', '#fbc02d', '#1976d2'];

    return (
        <div className="dashboard">
            <div className="card-header">
                <h2 className="card-title">Business Overview</h2>
                <div className="badge badge-success">Live Statistics</div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon"><FiShoppingCart /></div>
                    <div className="stat-info">
                        <h3>Monthly Sales</h3>
                        <div className="stat-value">₹{stats?.monthlySales?.total?.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(141, 110, 99, 0.1)', color: '#8d6e63' }}><FiShoppingBag /></div>
                    <div className="stat-info">
                        <h3>Purchases</h3>
                        <div className="stat-value">₹{stats?.monthlyPurchases?.total?.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(25, 118, 210, 0.1)', color: '#1976d2' }}><FiTrendingUp /></div>
                    <div className="stat-info">
                        <h3>Net Profit</h3>
                        <div className="stat-value">₹{stats?.monthlyProfit?.toLocaleString('en-IN')}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(211, 47, 47, 0.1)', color: '#d32f2f' }}><FiAlertTriangle /></div>
                    <div className="stat-info">
                        <h3>Alerts</h3>
                        <div className="stat-value">{stats?.lowStockCount + stats?.expiringCount} Issues</div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                    <h3 className="card-title mb-4">Sales Trend (Last 6 Months)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.salesTrend?.map(item => ({
                                month: `${item._id.month}/${item._id.year}`,
                                amount: item.total
                            })) || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="amount" stroke="#2e7d32" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title mb-4">Stock Value by Category</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.stockSummary || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="totalStock" fill="#4caf50" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid-2 mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 className="card-title mb-4">Stock Alerts</h3>
                    <div className="alert-list">
                        <div className="flex justify-between items-center mb-4 p-3 bg-red-50" style={{ background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid #d32f2f' }}>
                            <div>
                                <p style={{ fontWeight: '600', color: '#d32f2f' }}>Low Stock Items</p>
                                <p style={{ fontSize: '0.8rem' }}>{stats?.lowStockCount} items need attention</p>
                            </div>
                            <FiPackage color="#d32f2f" size={20} />
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50" style={{ background: '#fffbf0', borderRadius: '8px', borderLeft: '4px solid #fbc02d' }}>
                            <div>
                                <p style={{ fontWeight: '600', color: '#966909' }}>Expiring Soon</p>
                                <p style={{ fontSize: '0.8rem' }}>{stats?.expiringCount} batches expire within 30 days</p>
                            </div>
                            <FiClock color="#fbc02d" size={20} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title mb-4">Top Customers (This Month)</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Village</th>
                                    <th>Purchases</th>
                                    <th>Risk Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.topCustomers?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: '600' }}>{item.customer.name}</td>
                                        <td>{item.customer.village}</td>
                                        <td>₹{item.totalPurchases.toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={`badge ${item.totalPurchases > 100000 ? 'badge-success' : 'badge-warning'}`}>
                                                Excellent
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FiPackage = ({ ...props }) => <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"></path><polyline points="2.32 6.16 12 11 21.68 6.16"></polyline><line x1="12" y1="22.76" x2="12" y2="11"></line><polyline points="7 3.5 7 8.5"></polyline></svg>;
const FiClock = ({ ...props }) => <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

export default Dashboard;
