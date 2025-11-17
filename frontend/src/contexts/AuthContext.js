import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the application and provides authentication state
 * Manages user login, logout, and session validation
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Initialize as null, not from localStorage
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

      // Save token and user info
      localStorage.setItem('token', data.token);
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
   * Clears token and user info from state and localStorage
   */
  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
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
      localStorage.removeItem('token');
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
      const storedToken = localStorage.getItem('token');

      // No token stored - user needs to login
      if (!storedToken) {
        console.log('No token found in localStorage - redirecting to login');
        setLoading(false);
        setUser(null);
        setToken(null);
        return;
      }

      try {
        console.log('Validating stored token...');
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Session invalid: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Token validated successfully, user:', data.user.username);
        setUser(data.user);
        setToken(storedToken);
      } catch (err) {
        console.error('Session validation failed:', err.message);
        // CRITICAL: Clear invalid/expired token to force login
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [API_BASE_URL]);

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
