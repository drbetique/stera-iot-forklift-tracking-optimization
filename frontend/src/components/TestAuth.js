import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * TestAuth Component - Debugging Authentication Flow
 * This component helps diagnose authentication issues
 */
const TestAuth = () => {
  const { user, token, isAuthenticated, loading } = useAuth();
  const [testResults, setTestResults] = useState({
    localStorage: null,
    authContext: null,
    apiTest: null,
    backendHealth: null
  });

  useEffect(() => {
    runTests();
  }, [user, token]);

  const runTests = async () => {
    const results = {};

    // Test 1: Check localStorage
    const storedToken = localStorage.getItem('token');
    results.localStorage = {
      hasToken: !!storedToken,
      tokenLength: storedToken ? storedToken.length : 0,
      tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : 'No token'
    };

    // Test 2: Check AuthContext
    results.authContext = {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      loading,
      userRole: user?.role || 'N/A',
      username: user?.username || 'N/A'
    };

    // Test 3: Test Backend Health
    try {
      const healthResponse = await fetch('http://localhost:3001/health');
      const healthData = await healthResponse.json();
      results.backendHealth = {
        status: 'OK',
        data: healthData
      };
    } catch (error) {
      results.backendHealth = {
        status: 'ERROR',
        error: error.message
      };
    }

    // Test 4: Test API with authentication
    try {
      const forklifts = await api.getForklifts();
      results.apiTest = {
        status: 'SUCCESS',
        count: forklifts.length,
        sample: forklifts[0] || null
      };
    } catch (error) {
      results.apiTest = {
        status: 'ERROR',
        error: error.message
      };
    }

    setTestResults(results);
  };

  const testLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin@123'
        })
      });

      const data = await response.json();
      console.log('Login test result:', data);

      if (data.success) {
        localStorage.setItem('token', data.token);
        alert('Login successful! Token saved. Refreshing page...');
        window.location.reload();
      } else {
        alert('Login failed: ' + data.message);
      }
    } catch (error) {
      console.error('Login test error:', error);
      alert('Login test failed: ' + error.message);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    alert('Token cleared! Refreshing page...');
    window.location.reload();
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2e',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#f97316' }}>Authentication Diagnostic Tool</h1>

      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={runTests}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Run Tests
        </button>
        <button
          onClick={testLogin}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Login (admin)
        </button>
        <button
          onClick={clearAuth}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear Token
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* localStorage Test */}
        <div style={{
          backgroundColor: '#2d3748',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#f97316', marginTop: 0 }}>
            1. localStorage
            {testResults.localStorage?.hasToken ?
              <span style={{ color: '#10b981' }}> ✓</span> :
              <span style={{ color: '#ef4444' }}> ✗</span>
            }
          </h2>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(testResults.localStorage, null, 2)}
          </pre>
        </div>

        {/* AuthContext Test */}
        <div style={{
          backgroundColor: '#2d3748',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#f97316', marginTop: 0 }}>
            2. AuthContext
            {testResults.authContext?.isAuthenticated ?
              <span style={{ color: '#10b981' }}> ✓</span> :
              <span style={{ color: '#ef4444' }}> ✗</span>
            }
          </h2>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(testResults.authContext, null, 2)}
          </pre>
        </div>

        {/* Backend Health Test */}
        <div style={{
          backgroundColor: '#2d3748',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#f97316', marginTop: 0 }}>
            3. Backend Health
            {testResults.backendHealth?.status === 'OK' ?
              <span style={{ color: '#10b981' }}> ✓</span> :
              <span style={{ color: '#ef4444' }}> ✗</span>
            }
          </h2>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(testResults.backendHealth, null, 2)}
          </pre>
        </div>

        {/* API Test */}
        <div style={{
          backgroundColor: '#2d3748',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#f97316', marginTop: 0 }}>
            4. API Test (getForklifts)
            {testResults.apiTest?.status === 'SUCCESS' ?
              <span style={{ color: '#10b981' }}> ✓</span> :
              <span style={{ color: '#ef4444' }}> ✗</span>
            }
          </h2>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(testResults.apiTest, null, 2)}
          </pre>
        </div>
      </div>

      {/* Console Instructions */}
      <div style={{
        marginTop: '30px',
        backgroundColor: '#2d3748',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h2 style={{ color: '#f97316', marginTop: 0 }}>Browser Console Commands</h2>
        <p style={{ color: '#a0aec0' }}>Open DevTools Console (F12) and paste these commands:</p>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ color: '#f97316', fontSize: '14px' }}>Check Token:</h3>
          <code style={{
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            localStorage.getItem('token')
          </code>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ color: '#f97316', fontSize: '14px' }}>Test API Manually:</h3>
          <code style={{
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
{`fetch('http://localhost:3001/api/forklifts', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)`}
          </code>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ color: '#f97316', fontSize: '14px' }}>Test Login:</h3>
          <code style={{
            display: 'block',
            backgroundColor: '#1a1a2e',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
{`fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin@123'
  })
}).then(r => r.json()).then(console.log)`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;
