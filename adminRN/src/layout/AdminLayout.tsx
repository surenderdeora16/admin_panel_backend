// import React, { ReactNode, useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateAdmin } from '../redux/admin/adminSlice';
// import AxiosHelper from '../helper/AxiosHelper';
// import Header from '../components/Header/index';
// import Sidebar from '../components/Sidebar/index';
// import ProtectedRoute from '../ProtectedRoute';

// import Loader from '../common/Loader';
// import { RootState } from '../store';

// const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const dispatch = useDispatch();
//   const [loading, setLoading] = useState(true);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//  const adminData = useSelector((state: RootState) => state.admin)
//   // useEffect(() => {
//   //   const updateDataAdmin = async () => {
//   //     try {
//   //           console.log("AdminLayout")
//   //       const { data } = await AxiosHelper.getData('profile');
//   //       if (data?.status === true) {
//   //         dispatch(updateAdmin(data?.data));
//   //       }
//   //     } catch (error) {
//   //       // Error handling is done in AxiosHelper
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   updateDataAdmin();
//   // }, [dispatch]);

//   if (loading) return <div className="text-black">Admin layout.tsx<Loader /></div>;

//   return (
//     // <ProtectedRoute requiredRole="admin">
//     <div className="dark:bg-boxdark-2 dark:text-bodydark">
//       <div className="flex h-screen overflow-hidden">
//         <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//         <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
//           <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//           <main>
//             <div className="mx-auto max-w-full ">
//               {children}
//             </div>
//           </main>
//         </div>
//       </div>
//     </div>
//     // </ProtectedRoute>
//   );
// };

// export default AdminLayout;


"use client"

import type React from "react"
import { type ReactNode, useState } from "react"
import Header from "../components/Header/index"
import Sidebar from "../components/Sidebar/index"
import { useSelector } from "react-redux"
import type { RootState } from "../store"

const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get admin data from Redux store (already fetched by auth system)
  const adminData = useSelector((state: RootState) => state.admin)

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="mx-auto max-w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
