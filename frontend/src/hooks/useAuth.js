import { useState, useEffect } from 'react';
import client from '../api/client';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    setLoading(false);
                    return;
                }
                const storedUser = localStorage.getItem('user');
                setUser(storedUser ? JSON.parse(storedUser) : null);
            } catch (err) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    setUser(null);
                    window.location.href = '/login';
                }
            } catch { /* malformed token — ignore */ }
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    const login = async (email, password) => {
        const { data } = await client.post('/auth/login/', { email, password });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // data.user comes from CustomTokenObtainPairSerializer response body (not JWT payload)
        const userData = data.user;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return { user, login, logout, loading, setUser };
};
