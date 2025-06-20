// // import React, { useEffect } from 'react';
// // import { Route, Routes, Navigate } from 'react-router-dom';
// // import { useAuth } from './hooks/useAuth';
// // import ProtectedRoute from './ProtectedRoute';
// // import AdminRoutes from './AdminRoutes';
// // import SignIn from './pages/Authentication/SignIn';
// // import Loader from './common/Loader';
// // import { ToastContainer } from 'react-toastify';
// // import 'react-toastify/dist/ReactToastify.css';
// // import PrivicyPolicy from './pages/policy/PrivicyPolicy';

// // const App: React.FC = () => {
// //   const { isLoggedIn, checkAuth } = useAuth();

// //   useEffect(() => {
// //     checkAuth();
// //   }, []);

// //   return (
// //     <React.Fragment>
// //       <Routes>    
// //         <Route path="/privacy-policy" element={<PrivicyPolicy />} />
// //         <Route
// //           path="/login"
// //           element={isLoggedIn ? <Navigate to="/" replace /> : <SignIn />}
// //         />
// //         <Route
// //           path="/*"
// //           element={
// //             <ProtectedRoute>
// //               <AdminRoutes />
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route path="*" element={<Navigate to="/login" replace />} />
// //       </Routes>
// //       <div className="relative z-[2147483644]">
// //         <ToastContainer />
// //       </div>
// //     </React.Fragment>
// //   );
// // };

// // export default App;

// "use client"

// import React, { useEffect } from "react"
// import { Route, Routes, Navigate } from "react-router-dom"
// import { useAuth } from "./hooks/useAuth"
// import ProtectedRoute from "./ProtectedRoute"
// import AdminRoutes from "./AdminRoutes"
// import SignIn from "./pages/Authentication/SignIn"
// import Loader from "./common/Loader"
// import { ToastContainer } from "react-toastify"
// import "react-toastify/dist/ReactToastify.css"
// import PrivicyPolicy from "./pages/policy/PrivicyPolicy"

// const App: React.FC = () => {
//   const { isLoggedIn, authChecked, loading, checkAuth } = useAuth()

//   useEffect(() => {
//     // Check authentication only once when app loads
//     if (!authChecked) {
//       checkAuth()
//     }
//   }, [authChecked, checkAuth])

//   // Show loader while checking authentication
//   if (!authChecked || loading) {
//     return  <div className="text-black">APP.tsx<Loader /></div>
//   }

//   return (
//     <React.Fragment>
//       <Routes>
//         <Route path="/privacy-policy" element={<PrivicyPolicy />} />
//         <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <SignIn />} />
//         <Route
//           path="/*"
//           element={
//             <ProtectedRoute>
//               <AdminRoutes />
//             </ProtectedRoute>
//           }
//         />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//       <div className="relative z-[2147483644]">
//         <ToastContainer />
//       </div>
//     </React.Fragment>
//   )
// }

// export default App

"use client"

import React, { useEffect } from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import { useDispatch } from "react-redux"
import { syncAuthFromStorage } from "./store/slices/adminSlice"
import ProtectedRoute from "./ProtectedRoute"
import AdminRoutes from "./AdminRoutes"
import SignIn from "./pages/Authentication/SignIn"
import Loader from "./common/Loader"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import PrivicyPolicy from "./pages/policy/PrivicyPolicy"

const App: React.FC = () => {
  const { isLoggedIn, authChecked, checkAuth } = useAuth()
  const dispatch = useDispatch()

  useEffect(() => {
    console.log("🚀 App mounted, checking authentication...")

    // First sync auth state from localStorage
    dispatch(syncAuthFromStorage())

    // Then check authentication only once when app loads
    if (!authChecked) {
      console.log("🔍 Auth not checked yet, calling checkAuth...")
      checkAuth()
    } else {
      console.log("✅ Auth already checked")
    }
  }, [authChecked, checkAuth, dispatch])

  // Add this additional useEffect to handle page refresh
  useEffect(() => {
    const handlePageRefresh = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      if (isLoggedIn && !authChecked) {
        console.log("🔄 Page refreshed, re-checking auth...")
        checkAuth()
      }
    }

    // Check on mount
    handlePageRefresh()

    // Listen for storage changes (in case of multiple tabs)
    window.addEventListener("storage", handlePageRefresh)

    return () => {
      window.removeEventListener("storage", handlePageRefresh)
    }
  }, [authChecked, checkAuth])

  // Show loader while checking authentication
  if (!authChecked) {
    return <Loader />
  }

  return (
    <React.Fragment>
      <Routes>
        <Route path="/privacy-policy" element={<PrivicyPolicy />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <SignIn />} />
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
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </React.Fragment>
  )
}

export default App
