// src/services/api.js
const API_BASE_URL = 'http://localhost:3001/api';

const api = {
  async getForklifts() {
    try {
      const timestamp = new Date().getTime();
      const url = `${API_BASE_URL}/forklifts?_t=${timestamp}`;
      
      console.log('API: Fetching forklifts from', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      console.log('API: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn('API: Forklift fetch was not successful.', result.message);
        return [];
      }
      
      console.log(`API: ${result.count} forklifts fetched.`);
      return result.data || []; // Return the data array or an empty array
    } catch (error) {
      console.error('API: Error fetching forklifts:', error);
      throw error; // Re-throw the error to be caught by the component
    }
  },

  async getForkliftById(id) {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/forklifts/${id}?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API: Error fetching forklift:', error);
      return null;
    }
  },

  async getTelemetry() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/telemetry?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API: Error fetching telemetry:', error);
      return [];
    }
  },

  async getStations() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/stations?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API: Error fetching stations:', error);
      return [];
    }
  }
};

export default api;