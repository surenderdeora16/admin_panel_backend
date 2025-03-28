import axios from "axios";
import { toast } from 'react-toastify';
// import { logoutAdmin } from "../store/slices/adminSlice";

declare global {
    interface ImportMeta {
        env: {
            VITE_API_BASE_URL: string;
            VITE_LICENCE: string;
            VITE_LOG_ERRORS_IN_CONSOLE: string;
        };
    }
}

const commonHeaders = () => {
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    axios.defaults.headers.common['x-api-key'] = import.meta.env.VITE_LICENCE;
    axios.defaults.crossDomain = true;
    axios.defaults.withCredentials = true;
};


axios.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        if (error.response?.status === 401) {
            handleUnauthorized(error.response);
        }
        return Promise.reject(error);
    }
);


const handleUnauthorized = async (response: any) => {
    if (response.data.message == 'Invalid Login Credentials..!!') {
        toast.error(response.data.message);
        console.log('Invalid Login Credentials')
        return
    }
    toast.error('Session expired. Please login again.');
    localStorage.removeItem('isLoggedIn');
    // store.dispatch(logdedOutUser());
    window.location.href = '/login';
};

const errorHandler = (error: any) => {
    if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
        console.error('API Error:', error);
    }

    if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
            handleUnauthorized(error.response);
        } else if (status >= 500) {
            toast.error('Server error. Please try again later.');
        } else {
            toast.error(data?.message || 'An error occurred.');
        }
    } else if (error.request) {
        toast.error('No response from the server. Please check your internet connection.');
    } else {
        toast.error('An error occurred while processing your request.');
    }

    return Promise.reject(error);
};

const AxiosHelper = {
    getData: async (url: any, params = null) => {
        commonHeaders();
        return axios.get(url, { params }).catch(errorHandler);
    },
    postData: async (url: any, data: any, isMultipart = false) => {
        commonHeaders();
        const headers = isMultipart ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" };
        return axios.post(url, data, { headers }).catch(errorHandler);
    },
    putData: async (url: any, data: any, isMultipart = false) => {
        commonHeaders();
        const headers = isMultipart ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" };
        return axios.put(url, data, { headers }).catch(errorHandler);
    },
    deleteData: async (url: any) => {
        commonHeaders();
        return axios.delete(url).catch(errorHandler);
    }
};

export default AxiosHelper;

