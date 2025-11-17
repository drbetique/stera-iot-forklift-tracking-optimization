import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import apiConfig from '../config/api.config';

// Use shared API configuration
const API_BASE_URL = apiConfig.API_BASE_URL;

/**
 * Get authentication token from SecureStore
 */
const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get authentication headers with JWT token
 */
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Create axios instance with interceptors for auth
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    const headers = await getAuthHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token
      try {
        await SecureStore.deleteItemAsync('userToken');
      } catch (e) {
        console.error('Error clearing token:', e);
      }
      // The app will automatically redirect to login via AuthContext
    }
    return Promise.reject(error);
  }
);

const api = {
  // Health check
  healthCheck: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/health?_t=${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get all forklifts (matches web API)
  getForklifts: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/api/forklifts?_t=${timestamp}`);

      if (!response.data.success) {
        console.warn('API: Forklift fetch was not successful.', response.data.message);
        return [];
      }

      console.log(`API: ${response.data.count} forklifts fetched.`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch forklifts:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  getAllForklifts: async () => {
    return api.getForklifts();
  },

  // Get forklift by ID (matches web API)
  getForkliftById: async (id) => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/api/forklifts/${id}?_t=${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch forklift:', error);
      return null;
    }
  },

  // Legacy method for backward compatibility
  getForklift: async (forkliftId) => {
    return api.getForkliftById(forkliftId);
  },

  // Get latest telemetry for a forklift
  getLatestTelemetry: async (forkliftId) => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/api/telemetry/${forkliftId}/latest?_t=${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
      throw error;
    }
  },

  // Get telemetry history for a forklift
  getForkliftTelemetryHistory: async (forkliftId, options = {}) => {
    try {
      const { startDate, endDate, limit = 100 } = options;
      const params = new URLSearchParams({ limit });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const timestamp = new Date().getTime();
      params.append('_t', timestamp);

      const response = await apiClient.get(`/api/telemetry/${forkliftId}/history?${params}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch telemetry history:', error);
      return [];
    }
  },

  // Get all telemetry (matches web API)
  getTelemetry: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/api/telemetry?_t=${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
      return [];
    }
  },

  // Get all stations (matches web API)
  getStations: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/api/stations?_t=${timestamp}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      return [];
    }
  },

  // Legacy method for backward compatibility
  getAllStations: async () => {
    return api.getStations();
  },

  // ==================== USER MANAGEMENT (Admin Only) ====================

  /**
   * Get all users (Admin only)
   * @returns {Promise<Array>} Array of user objects
   */
  getUsers: async () => {
    try {
      const response = await apiClient.get('/api/auth/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  /**
   * Create a new user (Admin only)
   * @param {Object} userData - User data (username, email, password, fullName, role)
   * @returns {Promise<Object>} Created user object
   */
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/users', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  /**
   * Update a user (Admin only)
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data (fullName, role, email)
   * @returns {Promise<Object>} Updated user object
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/api/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  /**
   * Toggle user active status (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  toggleUserActive: async (userId) => {
    try {
      const response = await apiClient.put(`/api/auth/users/${userId}/toggle-active`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      throw error;
    }
  },

  /**
   * Delete a user (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/api/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },
};

export default api;
