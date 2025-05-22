import axios from 'axios';
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
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL + "admin/";
  axios.defaults.headers.common['x-api-key'] = import.meta.env.VITE_LICENCE;
  axios.defaults.crossDomain = true;
  axios.defaults.withCredentials = true;
};

const handleUnauthorized = async (response: any) => {
  if (response.data.message.includes('Invalid Login Credentials')) {
    toast.error(response.data.message);
    return Promise.reject(response.data.message);
  }

  toast.error('Session expired. Please login again.');
  localStorage.removeItem('isLoggedIn');
  window.location.href = '/login';
  return Promise.reject('Session expired');
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return handleUnauthorized(error.response);
    }
    return Promise.reject(error);
  },
);

const errorHandler = (error: any) => {
  if (import.meta.env.VITE_LOG_ERRORS_IN_CONSOLE === 'true') {
    console.error('API Error:', error);
  }

  if (error.response) {
    const { status, data } = error.response;

    if (status === 401) {
      handleUnauthorized(error.response);
    } else if (status === 404) {
      console.error('Resource not found:', error);
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(data?.message || 'An error occurred.');
    }
  } else if (error.request) {
    toast.error(
      'No response from the server. Please check your internet connection.',
    );
  } else {
    toast.error('An error occurred while processing your request.');
  }

  return Promise.reject(error);
};

const AxiosHelper = {
  getData: async (url: any, params = null, config = {}) => {
    commonHeaders();
    return axios.get(url, { params, ...config }).catch(errorHandler);
  },
  postData: async (url: any, data: any, isMultipart = false, config: any = {}) => {
    commonHeaders();
    const headers = isMultipart
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

      const mergedConfig = {
        headers,
        ...config,
      }
    return axios.post(url, data, mergedConfig).catch(errorHandler);
  },
  putData: async (url: any, data: any, isMultipart = false, config: any = {}) => {
    commonHeaders();
    const headers = isMultipart
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

        // Merge the provided config with our default config
        const mergedConfig = {
          headers,
          ...config,
        }

    return axios.put(url, data, mergedConfig).catch(errorHandler);
  },
  deleteData: async (url: any) => {
    commonHeaders();
    return axios.delete(url).catch(errorHandler);
  },
};

export default AxiosHelper;
