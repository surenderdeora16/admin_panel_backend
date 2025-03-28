import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AxiosHelper from '../../helper/AxiosHelper';

interface AdminState {
    data: any;
    isLoggedIn: boolean;
    name: string;
    email: string;
    mobile: string;
    image: string;
    loading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    name: localStorage.getItem('adminName') || '',
    email: localStorage.getItem('adminEmail') || '',
    mobile: localStorage.getItem('adminMobile') || '',
    image: localStorage.getItem('adminImage') || '',
    loading: false,
    error: null,
};

const retryRequest = async (fn: () => Promise<any>, retries: number) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            if (attempt < retries - 1 && error?.response?.status >= 500) {
                await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000)); // Exponential backoff
                attempt++;
            } else {
                throw error;
            }
        }
    }
};


export const loginAdmin = createAsyncThunk(
    'admin/login',
    async (credentials: { mobile: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await AxiosHelper.postData('/admin/login', credentials);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('adminName', response.data.name);
            localStorage.setItem('adminEmail', response.data.email);
            localStorage.setItem('adminMobile', response.data.mobile);
            localStorage.setItem('adminImage', response.data.image);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const logoutAdmin = createAsyncThunk(
    'admin/logout',
    async (_, { rejectWithValue }) => {
        try {
            await AxiosHelper.getData('/admin/logout');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminMobile');
            localStorage.removeItem('adminImage');
            return null;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchAdminProfile = createAsyncThunk(
    'admin/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await retryRequest(() => AxiosHelper.getData('/admin/profile'), 3);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loginAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAdmin.fulfilled, (state, action: PayloadAction<AdminState>) => {
                return { ...state, ...action.payload, isLoggedIn: true, loading: false, error: null };
            })
            .addCase(loginAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logoutAdmin.fulfilled, () => initialState)
            .addCase(fetchAdminProfile.fulfilled, (state, action: PayloadAction<AdminState>) => {
                return { ...state, ...action.payload, isLoggedIn: true, loading: false, error: null };
            });
    },
});

export default adminSlice.reducer;

