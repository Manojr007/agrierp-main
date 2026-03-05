import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiUsers, FiTruck, FiPackage, FiShoppingCart,
    FiDollarSign, FiBarChart2, FiCpu, FiSettings, FiLogOut, FiShoppingBag
} from 'react-icons/fi';

const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/customers', label: 'Customers', icon: FiUsers },
    { path: '/suppliers', label: 'Suppliers', icon: FiTruck },
    { path: '/inventory', label: 'Inventory', icon: FiPackage },
    { path: '/purchases', label: 'Purchases', icon: FiShoppingBag },
    { path: '/sales', label: 'Sales', icon: FiShoppingCart },
    { path: '/accounting', label: 'Accounting', icon: FiDollarSign },
    { path: '/reports', label: 'Reports', icon: FiBarChart2 },
    { path: '/ai-insights', label: 'AI Insights', icon: FiCpu },
    { path: '/settings', label: 'Settings', icon: FiSettings },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="brand-icon">🌾</span>
                <h1>AgriERP</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                    >
                        <item.icon className="nav-icon" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="user-info" style={{ marginBottom: '1rem' }}>
                    <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role}</span>
                    </div>
                </div>
                <button
                    className="btn btn-error w-full logout-btn"
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: '#e53935',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                    }}
                >
                    <FiLogOut /> Logout System
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
