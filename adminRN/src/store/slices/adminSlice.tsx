// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import AxiosHelper from '../../helper/AxiosHelper';

// interface AdminState {
//     data: any;
//     isLoggedIn: boolean;
//     name: string;
//     email: string;
//     mobile: string;
//     image: string;
//     loading: boolean;
//     error: string | null;
// }

// const initialState: AdminState = {
//     data: null,
//     isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
//     name: localStorage.getItem('adminName') || '',
//     email: localStorage.getItem('adminEmail') || '',
//     mobile: localStorage.getItem('adminMobile') || '',
//     image: localStorage.getItem('adminImage') || '',
//     loading: false,
//     error: null,
// };

// const retryRequest = async (fn: () => Promise<any>, retries: number) => {
//     let attempt = 0;
//     while (attempt < retries) {
//         try {
//             return await fn();
//         } catch (error: any) {
//             if (attempt < retries - 1 && error?.response?.status >= 500) {
//                 await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000)); // Exponential backoff
//                 attempt++;
//             } else {
//                 throw error;
//             }
//         }
//     }
// };


// export const loginAdmin = createAsyncThunk(
//     'login',
//     async (credentials: { mobile: string; password: string }, { rejectWithValue }) => {
//         try {
//             const response = await AxiosHelper.postData('login', credentials);
//             localStorage.setItem('isLoggedIn', 'true');
//             localStorage.setItem('adminName', response.data.name);
//             localStorage.setItem('adminEmail', response.data.email);
//             localStorage.setItem('adminMobile', response.data.mobile);
//             localStorage.setItem('adminImage', response.data.image);
//             return response.data;
//         } catch (error: any) {
//             console.log("error::",error)
//             return rejectWithValue(error.response.data);
//         }
//     }
// );

// export const logoutAdmin = createAsyncThunk(
//     'logout',
//     async (_, { rejectWithValue }) => {
//         try {
//             await AxiosHelper.getData('logout');
//             localStorage.removeItem('isLoggedIn');
//             localStorage.removeItem('adminName');
//             localStorage.removeItem('adminEmail');
//             localStorage.removeItem('adminMobile');
//             localStorage.removeItem('adminImage');
//             return null;
//         } catch (error: any) {
//             return rejectWithValue(error.response.data);
//         }
//     }
// );

// export const fetchAdminProfile = createAsyncThunk(
//     'fetchProfile',
//     async (_, { rejectWithValue }) => {
//         try {
//             console.log("AdminSLIce")
//             const response = await retryRequest(() => AxiosHelper.getData('profile'), 3);
//             return response.data;
//         } catch (error: any) {
//             return rejectWithValue(error.response.data);
//         }
//     }
// );

// const adminSlice = createSlice({
//     name: 'admin',
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             .addCase(loginAdmin.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(loginAdmin.fulfilled, (state, action: PayloadAction<AdminState>) => {
//                 return { ...state, ...action.payload, isLoggedIn: true, loading: false, error: null };
//             })
//             .addCase(loginAdmin.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload as string;
//             })
//             .addCase(logoutAdmin.fulfilled, () => initialState)
//             .addCase(fetchAdminProfile.fulfilled, (state, action: PayloadAction<AdminState>) => {
//                 return { ...state, ...action.payload, isLoggedIn: true, loading: false, error: null };
//             });
//     },
// });

// export default adminSlice.reducer;
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import AxiosHelper from "../../helper/AxiosHelper"

interface AdminState {
  data: any
  isLoggedIn: boolean
  authChecked: boolean
  name: string
  email: string
  mobile: string
  image: string
  loading: boolean
  error: string | null
}

const initialState: AdminState = {
  data: null,
  isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
  authChecked: false,
  name: localStorage.getItem("adminName") || "",
  email: localStorage.getItem("adminEmail") || "",
  mobile: localStorage.getItem("adminMobile") || "",
  image: localStorage.getItem("adminImage") || "",
  loading: false,
  error: null,
}

export const loginAdmin = createAsyncThunk(
  "admin/login",
  async (credentials: { mobile: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await AxiosHelper.postData("login", credentials)

      if (response.data) {
        // Store in localStorage
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("adminName", response.data.name || "")
        localStorage.setItem("adminEmail", response.data.email || "")
        localStorage.setItem("adminMobile", response.data.mobile || "")
        localStorage.setItem("adminImage", response.data.image || "")
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue({
        message: error.response?.data?.message || "Login failed",
        status: error.response?.status,
      })
    }
  },
)

export const logoutAdmin = createAsyncThunk("admin/logout", async (_, { rejectWithValue }) => {
  try {
    // Try to call logout API, but don't fail if it doesn't work
    await AxiosHelper.getData("logout")
  } catch (error: any) {
    console.warn("Logout API failed, but continuing with local logout:", error)
  }

  // Always clear localStorage regardless of API success/failure
  localStorage.removeItem("isLoggedIn")
  localStorage.removeItem("adminName")
  localStorage.removeItem("adminEmail")
  localStorage.removeItem("adminMobile")
  localStorage.removeItem("adminImage")

  return null
})

export const fetchAdminProfile = createAsyncThunk("admin/fetchProfile", async (_, { rejectWithValue, getState }) => {
  const state = getState() as { admin: AdminState }

  // Prevent multiple calls if already loading
  if (state.admin.loading) {
    return rejectWithValue({
      message: "Already fetching profile",
      status: 429,
    })
  }

  try {
    console.log("📡 Calling profile API...")
    const response = await AxiosHelper.getData("profile")
    console.log("✅ Profile API response:", response)

    if (response.data) {
      // Update localStorage with fresh data
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("adminName", response.data.name || "")
      localStorage.setItem("adminEmail", response.data.email || "")
      localStorage.setItem("adminMobile", response.data.mobile || "")
      localStorage.setItem("adminImage", response.data.image || "")
    }

    return response.data
  } catch (error: any) {
    console.error("❌ Profile API failed:", error)

    const errorResponse = {
      message: error.response?.data?.message || error.message || "Profile fetch failed",
      status: error.response?.status || 500,
    }

    // Clear localStorage on auth errors (token expired)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log("🔒 Clearing localStorage due to auth error")
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("adminName")
      localStorage.removeItem("adminEmail")
      localStorage.removeItem("adminMobile")
      localStorage.removeItem("adminImage")
    }

    return rejectWithValue(errorResponse)
  }
})

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAuthChecked: (state, action: PayloadAction<boolean>) => {
      state.authChecked = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetAuth: () => ({
      ...initialState,
      isLoggedIn: false,
      authChecked: true,
    }),
    syncAuthFromStorage: (state) => {
      const storedLoginStatus = localStorage.getItem("isLoggedIn")
      state.isLoggedIn = storedLoginStatus === "true"
      state.name = localStorage.getItem("adminName") || ""
      state.email = localStorage.getItem("adminEmail") || ""
      state.mobile = localStorage.getItem("adminMobile") || ""
      state.image = localStorage.getItem("adminImage") || ""
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.isLoggedIn = true
        state.data = action.payload
        state.name = action.payload?.name || ""
        state.email = action.payload?.email || ""
        state.mobile = action.payload?.mobile || ""
        state.image = action.payload?.image || ""
        state.error = null
      })
      .addCase(loginAdmin.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload?.message || "Login failed"
        state.isLoggedIn = false
      })

      // Logout cases
      .addCase(logoutAdmin.pending, (state) => {
        state.loading = true
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        return {
          ...initialState,
          isLoggedIn: false,
          authChecked: true,
          loading: false,
        }
      })
      .addCase(logoutAdmin.rejected, (state) => {
        // Even if logout API fails, clear the state
        return {
          ...initialState,
          isLoggedIn: false,
          authChecked: true,
          loading: false,
        }
      })

      // Profile fetch cases
      .addCase(fetchAdminProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
        state.name = action.payload?.name || ""
        state.email = action.payload?.email || ""
        state.mobile = action.payload?.mobile || ""
        state.image = action.payload?.image || ""
        state.isLoggedIn = true
        state.error = null
      })
      .addCase(fetchAdminProfile.rejected, (state, action: any) => {
        state.loading = false
        state.error = action.payload?.message || "Profile fetch failed"

        // Only logout on auth errors (401, 403)
        if (action.payload?.status === 401 || action.payload?.status === 403) {
          state.isLoggedIn = false
        }
        // For other errors (network, 500, etc.), keep user logged in
      })
  },
})

export const { setAuthChecked, clearError, resetAuth, syncAuthFromStorage } = adminSlice.actions
export default adminSlice.reducer
