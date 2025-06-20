// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { AppDispatch, RootState } from '../store';
// import { loginAdmin, logoutAdmin, fetchAdminProfile } from '../store/slices/adminSlice';
// import { useEffect } from 'react';

// export const useAuth = () => {
//     const dispatch = useDispatch<AppDispatch>();
//     const navigate = useNavigate();

//     const { loading, error } = useSelector((state: RootState) => state.admin);
//     const isLoggedIn = useSelector((state: RootState) => state.admin.isLoggedIn);

//     const login = async (mobile: string, password: string) => {
//         try {
//             const credentials = { mobile, password };
//             const response = await dispatch(loginAdmin(credentials)).unwrap();
//             if (response.status == true) {
//                 navigate('/');
//             }
//         } catch (error) {
//             console.error('Login failed:', error);
//         }
//     };

//     const logout = async () => {
//         try {
//             await dispatch(logoutAdmin()).unwrap();
//             navigate('/login');
//         } catch (error) {
//             console.error('Logout failed:', error);
//         }
//     };

//     const checkAuth = async () => {
//         if (isLoggedIn) {
//             try {
//                 await dispatch(fetchAdminProfile()).unwrap();
//             } catch (error) {
//                 console.error('Failed to fetch admin profile:', error);
//                 // If fetching profile fails, log out the user
//                 await logout();
//             }
//         }
//     };

//     useEffect(() => {
//         checkAuth();
//     }, []);

//     return { isLoggedIn, loading, error, login, logout, checkAuth };
// };
"use client"

import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import type { AppDispatch, RootState } from "../store"
import { loginAdmin, logoutAdmin, fetchAdminProfile, setAuthChecked, clearError } from "../store/slices/adminSlice"
import { useCallback, useRef } from "react"

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const profileFetchRef = useRef(false)

  const { loading, error, isLoggedIn, authChecked } = useSelector((state: RootState) => state.admin)

  const login = async (mobile: string, password: string) => {
    try {
      dispatch(clearError())
      const credentials = { mobile, password }
      const response = await dispatch(loginAdmin(credentials)).unwrap()

      if (response.status === true) {
        // After successful login, fetch profile
        try {
          await dispatch(fetchAdminProfile()).unwrap()
        } catch (profileError) {
          console.warn("Profile fetch failed after login, but continuing...")
        }
        navigate("/")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = async (force = false) => {
    try {
      if (!force) {
        await dispatch(logoutAdmin()).unwrap()
      } else {
        // Force logout without API call
        dispatch(logoutAdmin())
      }
      profileFetchRef.current = false
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      // Force logout even if API fails
      dispatch(logoutAdmin())
      profileFetchRef.current = false
      navigate("/login")
    }
  }

  const checkAuth = useCallback(async () => {
    // If already checked or currently checking, return
    if (authChecked || profileFetchRef.current) {
      return
    }

    // Check localStorage first
    const storedLoginStatus = localStorage.getItem("isLoggedIn")

    console.log("🔍 Checking auth status:", storedLoginStatus)

    // If not logged in according to localStorage, mark as checked
    if (storedLoginStatus !== "true") {
      console.log("❌ Not logged in according to localStorage")
      dispatch(setAuthChecked(true))
      return
    }

    // If logged in according to localStorage, try to fetch profile
    console.log("✅ User appears to be logged in, fetching profile...")
    profileFetchRef.current = true

    try {
      const response = await dispatch(fetchAdminProfile()).unwrap()
      console.log("✅ Profile fetched successfully:", response)
    } catch (error: any) {
      console.error("❌ Profile fetch failed during auth check:", error)

      // Check for token expiry or auth errors
      const isTokenExpired =
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.toLowerCase().includes("unauthorized") ||
        error?.message?.toLowerCase().includes("forbidden") ||
        error?.message?.toLowerCase().includes("token") ||
        error?.message?.toLowerCase().includes("expired")

      if (isTokenExpired) {
        console.log("🔒 Token expired or unauthorized, logging out...")
        await logout(true) // Force logout
      } else {
        console.log("🌐 Network or server error, keeping user logged in...")
        // Keep user logged in for network errors
      }
    } finally {
      profileFetchRef.current = false
      dispatch(setAuthChecked(true))
    }
  }, [authChecked, dispatch])

  return {
    isLoggedIn,
    loading,
    error,
    authChecked,
    login,
    logout,
    checkAuth,
  }
}
