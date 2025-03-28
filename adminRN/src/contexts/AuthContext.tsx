import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any;
    login: (mobile: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await axios.get('/api-v1/admin/profile', {
                withCredentials: true
            });
            if (response.data.status) {
                setIsAuthenticated(true);
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (mobile: string, password: string) => {
        try {
            const response = await axios.post('/api-v1/admin/login', { mobile, password }, {
                withCredentials: true
            });
            if (response.data.status) {
                setIsAuthenticated(true);
                setUser(response.data.data.user);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await axios.get('/api-v1/admin/logout', { withCredentials: true });
            setIsAuthenticated(false);
            setUser(null);
            Cookies.remove('accessToken');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

