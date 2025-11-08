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

  // Forklifts
  getAllForklifts: async () => {
    try {
      const response = await apiClient.get('/api/forklifts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch forklifts:', error);
      throw error;
    }
  },

  getForklift: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/forklifts/${forkliftId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch forklift:', error);
      throw error;
    }
  },

  createForklift: async (forkliftData) => {
    try {
      const response = await apiClient.post('/api/forklifts', forkliftData);
      return response.data;
    } catch (error) {
      console.error('Failed to create forklift:', error);
      throw error;
    }
  },

  // Telemetry
  getLatestTelemetry: async (forkliftId) => {
    try {
      const response = await apiClient.get(`/api/telemetry/${forkliftId}/latest`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch latest telemetry:', error);
      throw error;
    }
  },

  getTelemetryHistory: async (forkliftId, params = {}) => {
    try {
      const response = await apiClient.get(`/api/telemetry/${forkliftId}/history`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemetry history:', error);
      throw error;
    }
  },

  postTelemetry: async (telemetryData) => {
    try {
      const response = await apiClient.post('/api/telemetry', telemetryData);
      return response.data;
    } catch (error) {
      console.error('Failed to post telemetry:', error);
      throw error;
    }
  },

  // Stations
  getAllStations: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/stations', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stations:', error);
      throw error;
    }
  },

  getStation: async (stationId) => {
    try {
      const response = await apiClient.get(`/api/stations/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch station:', error);
      throw error;
    }
  },

  createStation: async (stationData) => {
    try {
      const response = await apiClient.post('/api/stations', stationData);
      return response.data;
    } catch (error) {
      console.error('Failed to create station:', error);
      throw error;
    }
  },
};

export default api;