import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Loader from './common/Loader';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isLoggedIn, loading, checkAuth } = useAuth();
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    if (loading) {
        return <Loader />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

