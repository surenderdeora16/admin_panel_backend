import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const AdminAuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoggedIn } = useSelector((state: RootState) => state.admin);
    const location = useLocation();

    if (isLoggedIn) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminAuthLayout;

