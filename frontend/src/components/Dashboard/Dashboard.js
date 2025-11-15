import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import ForkliftList from '../ForkliftList/ForkliftList';
import MapView from '../Map/MapView';
import ActivityChart from './ActivityChart';
import BatteryTrends from './BatteryTrends';
import FleetMetrics from './FleetMetrics';
import ActivityTimeline from './ActivityTimeline';
import NotificationPanel from './NotificationPanel';
import ExportPanel from './ExportPanel';
import HistoricalCharts from './HistoricalCharts';
import DateRangeFilter from './DateRangeFilter';
import api from '../../services/api';
import { formatNumber, formatPercentage } from '../../utils/formatters';

const Dashboard = () => {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  useEffect(() => {
    console.log('Dashboard mounted - fetching initial data...');
    fetchForklifts();
    
    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      console.log('Polling forklifts...');
      fetchForklifts();
    }, 10000);
    
    return () => {
      console.log('Dashboard unmounting - clearing interval');
      clearInterval(interval);
    };
  }, []);

  const fetchForklifts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      console.log('Fetching forklifts from API...');
      const data = await api.getForklifts();

      console.log('Forklifts received:', data);
      console.log('Forklift count:', data.length);

      if (Array.isArray(data) && data.length > 0) {
        setForklifts(data);
        setError(null);
        console.log('Forklifts state updated successfully');
      } else {
        console.warn('No forklifts returned from API');
        setForklifts([]);
      }

      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    } catch (err) {
      console.error('Error fetching forklifts:', err);
      setError('Failed to load fleet data. Check backend connection.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDateChange = (newDateRange) => {
    console.log('Date range changed:', newDateRange);
    setDateRange(newDateRange);
  };

  // Calculate statistics
  const stats = {
    total: forklifts.length,
    active: forklifts.filter(f => ['DRIVING', 'WORKING', 'IDLE'].includes(f.currentActivity)).length,
    working: forklifts.filter(f => f.currentActivity === 'WORKING').length,
    idle: forklifts.filter(f => f.currentActivity === 'IDLE').length,
    charging: forklifts.filter(f => f.currentActivity === 'CHARGING').length,
    parked: forklifts.filter(f => f.currentActivity === 'PARKED').length,
    avgBattery: forklifts.length > 0
      ? Math.round(forklifts.reduce((sum, f) => sum + (f.batteryLevel || 0), 0) / forklifts.length)
      : 0
  };

  console.log('Dashboard stats:', stats);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading fleet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          {error}
          <br />
          <button
            className="retry-button"
            onClick={() => fetchForklifts(true)}
            disabled={refreshing}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: 'white',
              color: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            {refreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (forklifts.length === 0) {
    return (
      <div className="dashboard">
        <div className="header">
          <div className="header-info">
            <div className="logo-container">
              <img src="/stera-logo.jpg" alt="Stera Technologies" className="stera-logo" />
            </div>
            <h1 className="dashboard-title">Forklift Fleet Management Dashboard</h1>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
        </div>
        <div style={{
          background: '#2d3748',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'white',
          marginTop: '40px'
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '24px' }}>No Forklifts Found</h2>
          <p style={{ color: '#a0aec0', marginBottom: '24px' }}>
            Add forklifts to your fleet to start monitoring.
          </p>
          <button
            className="refresh-data-button"
            onClick={() => fetchForklifts(true)}
            disabled={refreshing}
            style={{
              padding: '12px 24px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-info">
          <div className="logo-container">
            <img src="/stera-logo.jpg" alt="Stera Technologies" className="stera-logo" />
          </div>
          <h1 className="dashboard-title">Forklift Fleet Management Dashboard</h1>
          <div className="header-actions">
            <NotificationPanel forklifts={forklifts} />
            <ExportPanel forklifts={forklifts} stats={stats} />
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Forklifts</h3>
          <p className="stat-number">{formatNumber(stats.total)}</p>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p className="stat-number">{formatNumber(stats.active)}</p>
        </div>
        <div className="stat-card">
          <h3>Working</h3>
          <p className="stat-number">{formatNumber(stats.working)}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Battery</h3>
          <p className="stat-number">{formatPercentage(stats.avgBattery)}</p>
        </div>
      </div>

      {/* Phase 2: Analytics Grid */}
      <div className="analytics-grid">
        <ActivityChart forklifts={forklifts} />
        <BatteryTrends forklifts={forklifts} />
        <FleetMetrics forklifts={forklifts} />
        <ActivityTimeline forklifts={forklifts} />
      </div>

      {/* Phase 3: Historical Analysis */}
      <div className="phase3-section">
        <h2 className="section-title">Historical Analysis</h2>
        <DateRangeFilter onDateChange={handleDateChange} />
        <HistoricalCharts forklifts={forklifts} dateRange={dateRange} />
      </div>

      {/* Forklift List and Map */}
      <div className="content-grid">
        <ForkliftList forklifts={forklifts} />
        <MapView forklifts={forklifts} />
      </div>
    </div>
  );
};

export default Dashboard;