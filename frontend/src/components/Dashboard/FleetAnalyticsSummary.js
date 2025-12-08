import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FleetAnalyticsSummary.css';

const FleetAnalyticsSummary = () => {
  const [fleetSummary, setFleetSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchFleetSummary();
    const interval = setInterval(fetchFleetSummary, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFleetSummary = async () => {
    try {
      setLoading(true);
      const summary = await api.getFleetSummary();
      if (summary) {
        setFleetSummary(summary);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching fleet summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 1) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  const getImpactStatusColor = (count) => {
    if (count === 0) return '#10b981';
    if (count < 5) return '#eab308';
    if (count < 10) return '#f97316';
    return '#ef4444';
  };

  const getAccelerationColor = (accel) => {
    if (accel < 1.5) return '#10b981';
    if (accel < 2.5) return '#eab308';
    if (accel < 5.0) return '#f97316';
    return '#ef4444';
  };

  if (loading && !fleetSummary) {
    return (
      <div className="fleet-summary-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading fleet analytics...</p>
        </div>
      </div>
    );
  }

  if (!fleetSummary) {
    return (
      <div className="fleet-summary-panel">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No Analytics Data</h4>
          <p>Waiting for analytics data to be generated...</p>
        </div>
      </div>
    );
  }

  const { timeWindow, fleetSummary: summary, metadata } = fleetSummary;

  return (
    <div className="fleet-summary-panel">
      <div className="panel-header">
        <div className="header-title">
          <h3>📊 Fleet Performance Analytics</h3>
          <p className="header-subtitle">Real-time fleet-wide performance metrics</p>
        </div>

        {lastUpdate && (
          <div className="update-info">
            <span className="update-label">Last updated:</span>
            <span className="update-time">{formatTimestamp(lastUpdate)}</span>
          </div>
        )}
      </div>

      {/* Time Window Info */}
      {timeWindow && (
        <div className="time-window-info">
          <div className="window-item">
            <span className="window-label">⏱️ Analysis Window:</span>
            <span className="window-value">{formatDuration(timeWindow.durationSeconds)}</span>
          </div>
          <div className="window-item">
            <span className="window-label">🕐 Period:</span>
            <span className="window-value">
              {formatTimestamp(timeWindow.start)} - {formatTimestamp(timeWindow.end)}
            </span>
          </div>
        </div>
      )}

      {/* Fleet-wide Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h4>Total Samples</h4>
            <p className="card-value">{summary.totalSamples?.toLocaleString() || 0}</p>
            <p className="card-description">Data points collected</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🚜</div>
          <div className="card-content">
            <h4>Active Forklifts</h4>
            <p className="card-value">{summary.forkliftCount || 0}</p>
            <p className="card-description">Vehicles reporting</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ color: getAccelerationColor(summary.averageAcceleration) }}>
            ⚡
          </div>
          <div className="card-content">
            <h4>Avg Acceleration</h4>
            <p className="card-value" style={{ color: getAccelerationColor(summary.averageAcceleration) }}>
              {summary.averageAcceleration?.toFixed(2) || '0.00'}g
            </p>
            <p className="card-description">Fleet average</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ color: getAccelerationColor(summary.maxAcceleration) }}>
            🔥
          </div>
          <div className="card-content">
            <h4>Peak Acceleration</h4>
            <p className="card-value" style={{ color: getAccelerationColor(summary.maxAcceleration) }}>
              {summary.maxAcceleration?.toFixed(2) || '0.00'}g
            </p>
            <p className="card-description">Highest recorded</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ color: getImpactStatusColor(summary.totalImpactEvents) }}>
            💥
          </div>
          <div className="card-content">
            <h4>Impact Events</h4>
            <p className="card-value" style={{ color: getImpactStatusColor(summary.totalImpactEvents) }}>
              {summary.totalImpactEvents || 0}
            </p>
            <p className="card-description">
              {summary.totalImpactEvents === 0 ? 'All clear! 🎉' : 'Requires attention'}
            </p>
          </div>
        </div>

        {metadata && (
          <div className="summary-card">
            <div className="card-icon">⚙️</div>
            <div className="card-content">
              <h4>Processing Time</h4>
              <p className="card-value">{metadata.processingTimeMs || 0}ms</p>
              <p className="card-description">Analytics latency</p>
            </div>
          </div>
        )}
      </div>

      {/* Per-Forklift Breakdown */}
      {summary.byForklift && summary.byForklift.length > 0 && (
        <div className="forklift-breakdown">
          <h4 className="breakdown-title">📋 Individual Forklift Performance</h4>

          <div className="breakdown-table-container">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Forklift ID</th>
                  <th>Samples</th>
                  <th>Avg Accel (g)</th>
                  <th>Max Accel (g)</th>
                  <th>Impacts</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.byForklift.map((forklift, index) => {
                  const impactStatus = forklift.impactEvents === 0 ? 'good' :
                                      forklift.impactEvents < 3 ? 'warning' : 'danger';

                  return (
                    <tr key={forklift.forkliftId || index}>
                      <td className="forklift-id">
                        <span className="id-badge">{forklift.forkliftId}</span>
                      </td>
                      <td>{forklift.samples?.toLocaleString() || 0}</td>
                      <td style={{ color: getAccelerationColor(forklift.avgAcceleration) }}>
                        {forklift.avgAcceleration?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ color: getAccelerationColor(forklift.maxAcceleration) }}>
                        <strong>{forklift.maxAcceleration?.toFixed(2) || '0.00'}</strong>
                      </td>
                      <td style={{ color: getImpactStatusColor(forklift.impactEvents) }}>
                        <strong>{forklift.impactEvents || 0}</strong>
                      </td>
                      <td>
                        <span className={`status-badge status-${impactStatus}`}>
                          {impactStatus === 'good' && '✅ Good'}
                          {impactStatus === 'warning' && '⚠️ Monitor'}
                          {impactStatus === 'danger' && '🔴 Alert'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="panel-footer">
        <div className="footer-info">
          {metadata && (
            <span className="metadata-info">
              Source: {metadata.source} v{metadata.version}
            </span>
          )}
        </div>
        <button onClick={fetchFleetSummary} className="refresh-button" disabled={loading}>
          {loading ? '⏳ Refreshing...' : '🔄 Refresh Now'}
        </button>
      </div>
    </div>
  );
};

export default FleetAnalyticsSummary;
