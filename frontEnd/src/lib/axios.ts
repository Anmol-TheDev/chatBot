import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          console.warn("Unauthorized: Please log in again.");
          break;
        case 403:
          console.warn("Forbidden: You do not have permission.");
          break;
        case 404:
          console.warn("Resource not found.");
          break;
        case 500:
          console.error("Internal server error.");
          break;
        default:
          console.error(`API Error [${status}]:`, error.response.data);
      }
    } else if (error.request) {
      console.error("Network error: No response received from server.");
    } else {
      console.error("Request failed:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
