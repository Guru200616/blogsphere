import axios from 'axios';

// The application runs as a unified full-stack App, so API requests point directly to relative /api
const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically append local JWT tokens to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authorization errors or failures gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Trigger a session cleared if token is invalid or expired
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);
