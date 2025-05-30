import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import AdminRoutes from './AdminRoutes';
import SignIn from './pages/Authentication/SignIn';
import Loader from './common/Loader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivicyPolicy from './pages/policy/PrivicyPolicy';

const App: React.FC = () => {
  const { isLoggedIn, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <React.Fragment>
      <Routes>    
        <Route path="/privacy-policy" element={<PrivicyPolicy />} />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <div className="relative z-[2147483644]">
        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default App;
