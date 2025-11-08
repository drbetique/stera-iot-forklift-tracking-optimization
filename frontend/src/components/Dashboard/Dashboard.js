import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ForkliftList from '../ForkliftList/ForkliftList';
import './Dashboard.css';
import MapView from '../Map/MapView';

function Dashboard() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    totalForklifts: 0,
    activeForklifts: 0,
    idleForklifts: 0,
    workingForklifts: 0
  });

  useEffect(() => {
    checkBackendConnection();
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      checkBackendConnection();
      fetchStats();
    }, 10000);
    
    return () => clearInterval(interval);
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

  const fetchStats = async () => {
    try {
      const response = await api.getAllForklifts();
      if (response.success) {
        const forklifts = response.data;
        setStats({
          totalForklifts: forklifts.length,
          activeForklifts: forklifts.filter(f => f.status === 'active').length,
          idleForklifts: forklifts.filter(f => f.currentActivity === 'IDLE').length,
          workingForklifts: forklifts.filter(f => f.currentActivity === 'WORKING' || f.currentActivity === 'DRIVING').length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🚜 Stera IoT Dashboard</h1>
          <span className="live-indicator">🔴 LIVE</span>
        </div>
        <div className="header-info">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            Backend: {backendStatus}
          </span>
          <span className="refresh-info">
            🔄 Auto-refresh: 10s
          </span>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🚜</div>
            <div className="stat-info">
              <h3>{stats.totalForklifts}</h3>
              <p>Total Forklifts</p>
            </div>
          </div>

          <div className="stat-card active">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.activeForklifts}</h3>
              <p>Active</p>
            </div>
          </div>

          <div className="stat-card working">
            <div className="stat-icon">⚙️</div>
            <div className="stat-info">
              <h3>{stats.workingForklifts}</h3>
              <p>Working</p>
            </div>
          </div>

          <div className="stat-card idle">
            <div className="stat-icon">⏸️</div>
            <div className="stat-info">
              <h3>{stats.idleForklifts}</h3>
              <p>Idle</p>
            </div>
          </div>
        </div>

        {/* Forklift List */}
        <ForkliftList />

        {/* Map View */}
        <MapView />
      </main>
    </div>
  );
}

export default Dashboard;