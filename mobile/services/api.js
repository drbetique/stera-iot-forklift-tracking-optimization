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
  },
});

const api = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get all forklifts
  getAllForklifts: async () => {
    try {
      const response = await apiClient.get('/api/forklifts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch forklifts:', error);
      throw error;
    }
  },

  // Get forklift by ID
  getForklift: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/forklifts/${forkliftId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch forklift:', error);
      throw error;
    }
  },

  // Get latest telemetry
  getLatestTelemetry: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/telemetry/${forkliftId}/latest`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
      throw error;
    }
  },

  // Get all stations
  getAllStations: async () => {
    try {
      const response = await apiClient.get('/api/stations');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      throw error;
    }
  },
};

export default api;