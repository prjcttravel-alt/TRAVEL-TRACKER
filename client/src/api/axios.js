import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  
  if (import.meta.env.PROD) {
    if (req.method === 'get') {
      if (req.url === '/categories' || req.url.startsWith('/categories?')) {
        req.baseURL = '/TRAVEL-TRACKER';
        req.url = '/api/categories.json';
      } else if (req.url === '/events' || req.url.startsWith('/events?')) {
        req.baseURL = '/TRAVEL-TRACKER';
        req.url = '/api/events.json';
      } else if (req.url.match(/^\/events\/[a-zA-Z0-9]+$/)) {
        req.baseURL = '/TRAVEL-TRACKER';
        req.originalEventId = req.url.split('/').pop();
        req.url = '/api/events.json';
      }
    }
  }
  
  return req;
});

// Add a response interceptor to mock POST/PUT requests in PROD and handle single event filtering
API.interceptors.response.use(
  (res) => {
    if (import.meta.env.PROD && res.config.originalEventId) {
      const event = (res.data || []).find(e => e._id === res.config.originalEventId);
      res.data = { data: event || (res.data && res.data[0]), success: true };
    }
    return res;
  },
  (err) => {
    if (import.meta.env.PROD && err.config) {
      const isPostPutDelete = ['post', 'put', 'delete'].includes(err.config.method);
      const isProfileGet = err.config.method === 'get' && err.config.url.includes('/auth/profile');
      
      if (isPostPutDelete || isProfileGet) {
        console.log('Intercepted failing PROD request, mocking success response for demo purposes.');
        
        const mockUser = {
          _id: 'mock-user-123',
          name: 'Demo User',
          email: 'demo@traveltracker.com',
          role: 'user'
        };

        if (err.config.url.includes('/auth/login') || err.config.url.includes('/auth/register')) {
          localStorage.setItem('token', 'mock-jwt-token-123');
          return Promise.resolve({ data: { user: mockUser, token: 'mock-jwt-token-123' } });
        }
        
        if (err.config.url.includes('/auth/profile')) {
          return Promise.resolve({ data: mockUser });
        }

        // Mock generic success for bookings, reviews, etc.
        return Promise.resolve({ data: { success: true, message: 'Mock action successful' } });
      }
    }
    return Promise.reject(err);
  }
);

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('🌐 API Error:', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default API;
