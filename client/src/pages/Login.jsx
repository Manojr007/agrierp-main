import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAPI } from '../services/api';
import { toast } from 'react-toastify';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await loginAPI({ email, password });
            if (data.success) {
                login(data.user, data.token);
                toast.success('Welcome back to AgriERP!');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <span style={{ fontSize: '3rem' }}>🌾</span>
                    <h2>AgriERP</h2>
                    <p>Agriculture Retail Management</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="admin@agrierp.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                        New user? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Register Account</Link>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                        Production-Ready ERP for Seeds, Fertilizers & Pesticides
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
