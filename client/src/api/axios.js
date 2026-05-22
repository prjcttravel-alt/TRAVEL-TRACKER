import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  
  if (import.meta.env.PROD) {
    if (req.url === '/categories' || req.url.startsWith('/categories?')) {
      req.baseURL = '/TRAVEL-TRACKER';
      req.url = '/api/categories.json';
    }
    if (req.url === '/events' || req.url.startsWith('/events?')) {
      req.baseURL = '/TRAVEL-TRACKER';
      req.url = '/api/events.json';
    }
  }
  
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('🌐 API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default API;
