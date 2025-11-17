import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiConfig from '../config/api.config';

const AuthContext = createContext(null);

// Use shared API configuration to ensure consistency
const API_BASE_URL = apiConfig.API_BASE_URL;

/**
 * AuthProvider component for React Native mobile app
 * Uses SecureStore for secure token storage
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Save token to SecureStore
   * @param {string} tokenValue - JWT token
   */
  const saveToken = async (tokenValue) => {
    try {
      await SecureStore.setItemAsync('userToken', tokenValue);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  /**
   * Get token from SecureStore
   * @returns {Promise<string|null>} Token or null
   */
  const getToken = async () => {
    try {
      return await SecureStore.getItemAsync('userToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  /**
   * Remove token from SecureStore
   */
  const removeToken = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  /**
   * Login function
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} - Login result
   */
  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token securely
      await saveToken(data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   * Clears token and user info from state and SecureStore
   */
  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state regardless of API call result
      await removeToken();
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  /**
   * Validate session on mount
   * Checks if stored token is still valid by calling /api/auth/me
   */
  useEffect(() => {
    const validateSession = async () => {
      const storedToken = await getToken();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Session invalid');
        }

        const data = await response.json();
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        console.error('Session validation failed:', err);
        // Clear invalid token
        await removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  /**
   * Update user info (after profile changes, etc.)
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
