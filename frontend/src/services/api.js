// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get authentication headers with JWT token
 * @returns {Object} Headers object with Authorization token if available
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
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
 * Handle API errors and redirect to login if unauthorized
 * @param {Response} response - Fetch response object
 * @throws {Error} If response is not ok
 */
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Token expired or invalid - clear and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication required. Please login again.');
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to access this resource.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response;
};

const api = {
  /**
   * Fetch all forklifts
   * @returns {Promise<Array>} Array of forklift objects
   */
  async getForklifts() {
    try {
      const timestamp = new Date().getTime();
      const url = `${API_BASE_URL}/forklifts?_t=${timestamp}`;

      console.log('API: Fetching forklifts from', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        console.warn('API: Forklift fetch was not successful.', result.message);
        return [];
      }

      console.log(`API: ${result.count} forklifts fetched.`);
      return result.data || [];
    } catch (error) {
      console.error('API: Error fetching forklifts:', error);
      throw error;
    }
  },

  /**
   * Fetch a single forklift by ID
   * @param {string} id - Forklift ID
   * @returns {Promise<Object|null>} Forklift object or null
   */
  async getForkliftById(id) {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/forklifts/${id}?_t=${timestamp}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      await handleResponse(response);

      return await response.json();
    } catch (error) {
      console.error('API: Error fetching forklift:', error);
      return null;
    }
  },

  /**
   * Fetch telemetry data
   * @returns {Promise<Array>} Array of telemetry objects
   */
  async getTelemetry() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/telemetry?_t=${timestamp}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      await handleResponse(response);

      return await response.json();
    } catch (error) {
      console.error('API: Error fetching telemetry:', error);
      return [];
    }
  },

  /**
   * Fetch all stations
   * @returns {Promise<Array>} Array of station objects
   */
  async getStations() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/stations?_t=${timestamp}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      await handleResponse(response);

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('API: Error fetching stations:', error);
      return [];
    }
  },

  /**
   * Fetch telemetry history for a specific forklift
   * @param {string} forkliftId - Forklift ID
   * @param {Object} options - Query options (startDate, endDate, limit)
   * @returns {Promise<Array>} Array of telemetry data
   */
  async getForkliftTelemetryHistory(forkliftId, options = {}) {
    try {
      const { startDate, endDate, limit = 100 } = options;
      const params = new URLSearchParams({ limit });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const timestamp = new Date().getTime();
      params.append('_t', timestamp);

      const response = await fetch(
        `${API_BASE_URL}/telemetry/${forkliftId}/history?${params}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        }
      );

      await handleResponse(response);

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('API: Error fetching telemetry history:', error);
      return [];
    }
  },

  /**
   * Fetch latest telemetry for a specific forklift
   * @param {string} forkliftId - Forklift ID
   * @returns {Promise<Object|null>} Latest telemetry data or null
   */
  async getForkliftLatestTelemetry(forkliftId) {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${API_BASE_URL}/telemetry/${forkliftId}/latest?_t=${timestamp}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        }
      );

      await handleResponse(response);

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('API: Error fetching latest telemetry:', error);
      return null;
    }
  },

  /* ==================== User Management APIs (Admin Only) ==================== */

  /**
   * Fetch all users (Admin only)
   * @returns {Promise<Array>} Array of user objects
   */
  async getUsers() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/auth/users?_t=${timestamp}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        console.warn('API: Users fetch was not successful.', result.message);
        return [];
      }

      console.log(`API: ${result.count} users fetched.`);
      return result.users || [];
    } catch (error) {
      console.error('API: Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Create a new user (Admin only)
   * @param {Object} userData - User data (username, email, password, fullName, role)
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create user');
      }

      console.log('API: User created successfully:', result.user);
      return result.user;
    } catch (error) {
      console.error('API: Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user details (Admin only)
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update (fullName, email, role)
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update user');
      }

      console.log('API: User updated successfully:', result.user);
      return result.user;
    } catch (error) {
      console.error('API: Error updating user:', error);
      throw error;
    }
  },

  /**
   * Toggle user active status (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user object
   */
  async toggleUserActive(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to toggle user status');
      }

      console.log('API: User status toggled successfully:', result.user);
      return result.user;
    } catch (error) {
      console.error('API: Error toggling user status:', error);
      throw error;
    }
  },

  /**
   * Delete a user (Admin only)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      await handleResponse(response);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete user');
      }

      console.log('API: User deleted successfully');
    } catch (error) {
      console.error('API: Error deleting user:', error);
      throw error;
    }
  }
};

export default api;
