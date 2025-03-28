import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
    isLoggedIn: boolean;
    name: string;
    email: string;
    mobile: string;
    image: string;
}

const initialState: AdminState = (() => {
    const storedAdmin = localStorage.getItem('admin');
    return storedAdmin
        ? JSON.parse(storedAdmin)
        : {
            isLoggedIn: localStorage.getItem('isLogedIn') === 'true',
            name: '',
            email: '',
            mobile: '',
            image: '',
        };
})();

export const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        updateAdmin: (state, action: PayloadAction<Partial<AdminState>>) => {
            const updatedState = { ...state, ...action.payload };
            localStorage.setItem('admin', JSON.stringify(updatedState));
            return updatedState;
        },
        logdedInAdmin: (state, action: PayloadAction<Omit<AdminState, 'isLoggedIn'>>) => {
            localStorage.setItem('isLogedIn', 'true');
            const updatedState = { ...state, ...action.payload, isLoggedIn: true };
            localStorage.setItem('admin', JSON.stringify(updatedState))
            return updatedState;
        },
        logdedOutAdmin: () => {
            localStorage.removeItem('admin');
            localStorage.removeItem('isLogedIn');
            return {
                isLoggedIn: false,
                name: '',
                email: '',
                mobile: '',
                image: '',
            };
        },
    },
});

export const { updateAdmin, logdedInAdmin, logdedOutAdmin } = adminSlice.actions;

export default adminSlice.reducer;
