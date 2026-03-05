import { createContext, useContext, useState, useEffect } from 'react';
import { getMeAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('agrierp_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            getMeAPI()
                .then((res) => setUser(res.data.data))
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (userData, jwtToken) => {
        localStorage.setItem('agrierp_token', jwtToken);
        localStorage.setItem('agrierp_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('agrierp_token');
        localStorage.removeItem('agrierp_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
