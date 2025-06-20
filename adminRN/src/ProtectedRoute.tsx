// import React, { useEffect } from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from './hooks/useAuth';
// import Loader from './common/Loader';

// interface ProtectedRouteProps {
//     children: React.ReactNode;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//     const { isLoggedIn, loading, checkAuth } = useAuth();
//     const location = useLocation();

//     useEffect(() => {
//         checkAuth();
//     }, []);

//     if (loading) {
//         return <Loader />;
//     }

//     if (!isLoggedIn) {
//         return <Navigate to="/login" state={{ from: location }} replace />;
//     }

//     return <>{children}</>;
// };

// export default ProtectedRoute;


import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "./store"
import Loader from "./common/Loader"

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, authChecked, loading } = useSelector((state: RootState) => state.admin)
  const location = useLocation()

  // Show loader if still checking auth or loading
  if (!authChecked || loading) {
    return <Loader />
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
