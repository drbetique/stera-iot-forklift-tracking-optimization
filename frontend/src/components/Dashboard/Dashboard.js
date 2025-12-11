import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
import ImpactEventsPanel from './ImpactEventsPanel';
import FleetAnalyticsSummary from './FleetAnalyticsSummary';
import SensorInsights from './SensorInsights';
import ImpactAlert from './ImpactAlert';
import api from '../../services/api';
import UserMenu from '../UserMenu/UserMenu';
import { formatNumber, formatPercentage } from '../../utils/formatters';

// Quick Navigation Component - Renders to document body via Portal
const QuickNav = ({ scrollToSection }) => {
  return ReactDOM.createPortal(
    <div className="quick-nav">
      <button onClick={() => scrollToSection('stats')} className="nav-item" title="Statistics">
        📊
      </button>
      <button onClick={() => scrollToSection('fleet-overview')} className="nav-item" title="Fleet Overview">
        🚜
      </button>
      <button onClick={() => scrollToSection('sensor-insights')} className="nav-item" title="Sensor Insights">
        🔬
      </button>
      <button onClick={() => scrollToSection('analytics')} className="nav-item" title="Analytics">
        📈
      </button>
      <button onClick={() => scrollToSection('safety')} className="nav-item" title="Safety Monitoring">
        💥
      </button>
      <button onClick={() => scrollToSection('historical')} className="nav-item" title="Historical Data">
        📜
      </button>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="nav-item" title="Back to Top">
        ⬆️
      </button>
    </div>,
    document.body
  );
};

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
    fetchForklifts();

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchForklifts();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchForklifts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      const forkliftData = await api.getForklifts();

      if (Array.isArray(forkliftData)) {
        setForklifts(forkliftData);
        setError(null);
      } else {
        setForklifts([]);
      }

      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching forklifts:', err);
      }
      setError('Failed to load fleet data. Check backend connection.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  if (loading) {
    return (
      <>
        <QuickNav scrollToSection={scrollToSection} />
        <div className="dashboard">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading fleet data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <QuickNav scrollToSection={scrollToSection} />
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
      </>
    );
  }

  if (forklifts.length === 0) {
    return (
      <>
        <QuickNav scrollToSection={scrollToSection} />
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
      </>
    );
  }

  return (
    <>
      <QuickNav scrollToSection={scrollToSection} />
      <ImpactAlert forklifts={forklifts} />
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
            <UserMenu />
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats Overview - Quick Metrics at a Glance */}
      <div className="stats-container" id="stats">
        <div className="stat-card" title="Total number of forklifts in your fleet">
          <div className="stat-icon">🚜</div>
          <h3>Total Forklifts</h3>
          <p className="stat-number">{formatNumber(stats.total)}</p>
          <p className="stat-description">Entire fleet size</p>
        </div>
        <div className="stat-card" title="Forklifts currently in use (DRIVING, WORKING, or IDLE)">
          <div className="stat-icon">✅</div>
          <h3>Active Now</h3>
          <p className="stat-number">{formatNumber(stats.active)}</p>
          <p className="stat-description">{stats.active} of {stats.total} in operation</p>
        </div>
        <div className="stat-card" title="Forklifts actively loading or unloading">
          <div className="stat-icon">⚙️</div>
          <h3>Working</h3>
          <p className="stat-number">{formatNumber(stats.working)}</p>
          <p className="stat-description">Loading/Unloading now</p>
        </div>
        <div className="stat-card" title="Average battery level across all forklifts">
          <div className="stat-icon">🔋</div>
          <h3>Avg Battery</h3>
          <p className="stat-number">{formatPercentage(stats.avgBattery)}</p>
          <p className="stat-description">Fleet battery health</p>
        </div>
      </div>

      {/* Quick Reference Legend */}
      <div className="legend-section" id="legend">
        <div className="legend-header">
          <h3>📊 Quick Reference Guide</h3>
          <p className="legend-subtitle">Understand your fleet at a glance</p>
        </div>
        <div className="legend-content">
          <div className="legend-group">
            <h4>Forklift Activity States</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge activity-working">WORKING</span>
                <span className="legend-description">Actively loading/unloading with fork raised</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge activity-driving">DRIVING</span>
                <span className="legend-description">In motion, transporting materials</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge activity-idle">IDLE</span>
                <span className="legend-description">Engine on, minimal movement detected</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge activity-charging">CHARGING</span>
                <span className="legend-description">At charging station (RFID detected)</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge activity-parked">PARKED</span>
                <span className="legend-description">Engine off, no movement</span>
              </div>
            </div>
          </div>
          <div className="legend-group">
            <h4>Battery Health Indicators</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge battery-good">80-100%</span>
                <span className="legend-description">Optimal - Full charge</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge battery-medium">50-79%</span>
                <span className="legend-description">Adequate - Monitor usage</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge battery-low">20-49%</span>
                <span className="legend-description">Low - Consider charging</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge battery-critical">&lt;20%</span>
                <span className="legend-description">Critical - Charge immediately</span>
              </div>
            </div>
          </div>
          <div className="legend-group">
            <h4>Key Metrics Explained</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-icon">🚜</span>
                <span className="legend-description"><strong>Active:</strong> Forklifts currently in operation (DRIVING, WORKING, or IDLE)</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">⚡</span>
                <span className="legend-description"><strong>Average Battery:</strong> Fleet-wide battery level across all forklifts</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">📍</span>
                <span className="legend-description"><strong>Location:</strong> Real-time GPS coordinates updated every 10 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Fleet Overview & Location Tracking - Primary Content */}
      <div className="fleet-overview-section" id="fleet-overview">
        <div className="section-header">
          <h2 className="section-title">🚜 Fleet Overview & Location Tracking</h2>
          <p className="section-description">Detailed forklift information and real-time GPS positioning</p>
        </div>
        <div className="content-grid">
          <ForkliftList forklifts={forklifts} />
          <MapView forklifts={forklifts} />
        </div>
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Sensor Insights - Human Readable Data */}
      <div className="sensor-insights-section" id="sensor-insights">
        <div className="section-header">
          <h2 className="section-title">🔬 Live Sensor Insights</h2>
          <p className="section-description">Human-readable sensor data with intelligent health monitoring</p>
        </div>
        {forklifts.map((forklift) => (
          forklift.lastTelemetry && (
            <SensorInsights key={forklift.forkliftId} forklift={forklift} />
          )
        ))}
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Real-Time Analytics */}
      <div className="analytics-section" id="analytics">
        <div className="section-header">
          <h2 className="section-title">📈 Real-Time Analytics</h2>
          <p className="section-description">Live fleet performance metrics updated every 10 seconds</p>
        </div>
        <div className="analytics-grid">
          <ActivityChart forklifts={forklifts} />
          <BatteryTrends forklifts={forklifts} />
          <FleetMetrics forklifts={forklifts} />
          <ActivityTimeline forklifts={forklifts} />
        </div>
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* MQTT Analytics & Impact Detection */}
      <div className="mqtt-analytics-section" id="safety">
        <div className="section-header">
          <h2 className="section-title">💥 Advanced Analytics & Safety Monitoring</h2>
          <p className="section-description">AI-powered impact detection and fleet performance insights from MQTT sensor data</p>
        </div>
        <FleetAnalyticsSummary />
        <ImpactEventsPanel />
      </div>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* Historical Analysis */}
      <div className="phase3-section" id="historical">
        <div className="section-header">
          <h2 className="section-title">📊 Historical Analysis</h2>
          <p className="section-description">Review fleet activity trends over custom time periods</p>
        </div>
        <DateRangeFilter onDateChange={handleDateChange} />
        <HistoricalCharts forklifts={forklifts} dateRange={dateRange} />
      </div>
    </div>
    </>
  );
};

export default Dashboard;
