import React, { ReactNode, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateAdmin } from '../redux/admin/adminSlice';
import AxiosHelper from '../helper/AxiosHelper';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import ProtectedRoute from '../ProtectedRoute';

import Loader from '../common/Loader';

const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const updateDataAdmin = async () => {
      try {
        const { data } = await AxiosHelper.getData('/admin/profile');
        if (data?.status === true) {
          dispatch(updateAdmin(data?.data));
        }
      } catch (error) {
        // Error handling is done in AxiosHelper
      } finally {
        setLoading(false);
      }
    };

    updateDataAdmin();
  }, [dispatch]);

  if (loading) return <Loader />;

  return (
    // <ProtectedRoute requiredRole="admin">
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    // </ProtectedRoute>
  );
};

export default AdminLayout;
