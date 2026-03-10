import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api'; // Use environment variable

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to attach auth token if needed
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Example: store token in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


const services = {
  // Paystub related
  getPaystubs: () => apiService.get('/paystubs'),
  getPaystubById: (id) => apiService.get(`/paystubs/${id}`),
  uploadPaystubPdf: (formData) => apiService.post('/paystubs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Hours related
  // Expects an array of objects like: [{ dayOfWeek: 'monday', hours: 8, paystubId: 'uuid', date: 'YYYY-MM-DD' }]
  saveHours: (hoursData) => apiService.post('/hours', { hours: hoursData }),
  // In a more complex scenario, you might have specific endpoints:
  // getHoursForPaystub: (paystubId) => apiService.get(`/paystubs/${paystubId}/hours`),
  // updateHourEntry: (id, data) => apiService.put(`/hours/${id}`, data),

  // User/Profile related
  getUserProfile: (userId = 'me') => apiService.get(`/users/${userId}`), // 'me' implies current authenticated user
  // userId parameter is added in case we need to update a specific user's profile, otherwise assumes 'me'
  uploadProfilePicture: (userId, formData) => apiService.post(`/users/${userId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default services;
