import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
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

  // Get forklift telemetry (will be implemented when backend is ready)
  getForkliftTelemetry: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/forklift/${forkliftId}/telemetry`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
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

  // Get trip history
  getTripHistory: async (forkliftId, startDate, endDate) => {
    try {
      const response = await apiClient.get(`/api/forklift/${forkliftId}/trips`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip history:', error);
      throw error;
    }
  },

  // Get analytics
  getAnalytics: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/forklift/${forkliftId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },
};

export default api;