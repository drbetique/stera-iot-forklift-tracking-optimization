import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check backend connection on mount
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await api.healthCheck();
      setBackendStatus('Connected ✓');
      setIsConnected(true);
      console.log('Backend health:', response);
    } catch (error) {
      setBackendStatus('Disconnected ✗');
      setIsConnected(false);
      console.error('Backend connection failed:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🚜 Stera IoT Dashboard</h1>
        <div className="header-info">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            Backend: {backendStatus}
          </span>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Stera IoT Forklift Tracking System</h2>
          <p>Real-time monitoring and analytics for your fleet</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Real-Time Tracking</h3>
              <p>GPS + UWB positioning for accurate location</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Trip counting, distance, and utilization metrics</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Activity Detection</h3>
              <p>Intelligent state classification (Idle, Driving, Working)</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚠️</div>
              <h3>Safety Alerts</h3>
              <p>Collision avoidance and safety monitoring</p>
            </div>
          </div>

          <div className="status-section">
            <h3>System Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="label">Backend API:</span>
                <span className={isConnected ? 'value-success' : 'value-error'}>
                  {backendStatus}
                </span>
              </div>
              <div className="status-item">
                <span className="label">Frontend:</span>
                <span className="value-success">Running ✓</span>
              </div>
              <div className="status-item">
                <span className="label">Active Forklifts:</span>
                <span className="value">0 (Demo Mode)</span>
              </div>
            </div>
          </div>

          <button className="refresh-btn" onClick={checkBackendConnection}>
            🔄 Refresh Connection
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;