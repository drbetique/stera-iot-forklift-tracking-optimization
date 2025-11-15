import axios from 'axios';

// IMPORTANT: Change this to your computer's local IP address
// Find it by running 'ipconfig' in terminal and look for IPv4 Address
// Example: 192.168.1.100
const API_BASE_URL = 'http://10.237.16.244:3001'; // CAN BE CHANGED!

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
});

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
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      return [];
    }
  },

  // Legacy method for backward compatibility
  getAllStations: async () => {
    return api.getStations();
  },
};

export default api;