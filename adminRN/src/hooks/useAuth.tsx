import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { loginAdmin, logoutAdmin, fetchAdminProfile } from '../store/slices/adminSlice';
import { useEffect } from 'react';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state: RootState) => state.admin);
    const isLoggedIn = useSelector((state: RootState) => state.admin.isLoggedIn);

    const login = async (mobile: string, password: string) => {
        try {
            const credentials = { mobile, password };
            const response = await dispatch(loginAdmin(credentials)).unwrap();
            console.log('response', response);
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logout = async () => {
        try {
            await dispatch(logoutAdmin()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const checkAuth = async () => {
        if (isLoggedIn) {
            try {
                await dispatch(fetchAdminProfile()).unwrap();
            } catch (error) {
                console.error('Failed to fetch admin profile:', error);
                // If fetching profile fails, log out the user
                await logout();
            }
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return { isLoggedIn, loading, error, login, logout, checkAuth };
};

