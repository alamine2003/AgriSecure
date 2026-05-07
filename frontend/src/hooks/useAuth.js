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
                // In the real app, decoded data contains the user info or we fetch from an endpoint.
                // Assuming CustomTokenObtainPairSerializer adds user to token
                setUser(decoded.user || JSON.parse(localStorage.getItem('user')));
            } catch (err) {
                localStorage.removeItem('access_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await client.post('/auth/login/', { email, password });
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        const decoded = jwtDecode(data.access);
        const userData = decoded.user;
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
