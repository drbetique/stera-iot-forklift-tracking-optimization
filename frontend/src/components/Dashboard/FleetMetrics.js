import React, { useState, useEffect } from 'react';
import './AnalyticsComponents.css';
import { formatNumber, formatPercentage, formatDistance, formatSpeed, formatDuration } from '../../utils/formatters';

function FleetMetrics({ forklifts }) {
  const [metrics, setMetrics] = useState({
    utilization: 0,
    averageSpeed: 0,
    totalDistance: 0,
    activeHours: 0,
    mostActive: { name: '-', activity: '-' }
  });

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      // Calculate utilization rate
      const productive = forklifts.filter(
        f => f.currentActivity === 'WORKING' || f.currentActivity === 'DRIVING'
      ).length;
      const utilization = Math.round((productive / forklifts.length) * 100);

      // Find most active forklift
      const mostActive = forklifts.reduce((prev, current) => {
        const prevActivity = prev.currentActivity || 'UNKNOWN';
        const currentActivity = current.currentActivity || 'UNKNOWN';
        const isMoreActive = 
          (currentActivity === 'WORKING' || currentActivity === 'DRIVING') &&
          (prevActivity !== 'WORKING' && prevActivity !== 'DRIVING');
        return isMoreActive ? current : prev;
      }, forklifts[0] || {});

      // Simulated metrics (would come from telemetry data)
      const calculatedMetrics = {
        utilization: utilization,
        averageSpeed: Math.round(Math.random() * 5 + 3), // 3-8 km/h typical
        totalDistance: Math.round(Math.random() * 50 + 20), // 20-70 km today
        activeHours: Math.round(Math.random() * 4 + 4), // 4-8 hours today
        mostActive: {
          name: mostActive.name || 'N/A',
          activity: mostActive.currentActivity || 'UNKNOWN'
        }
      };

      setMetrics(calculatedMetrics);
    }
  }, [forklifts]);

  const getUtilizationColor = () => {
    if (metrics.utilization >= 70) return '#10b981';
    if (metrics.utilization >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">📈 Fleet Performance</h3>
        <p className="chart-subtitle">Key metrics today</p>
      </div>

      <div className="fleet-metrics">
        {/* Utilization Rate */}
        <div className="metric-card highlight">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value" style={{ color: getUtilizationColor() }}>
              {formatPercentage(metrics.utilization)}
            </div>
            <div className="metric-label">Utilization Rate</div>
            <div className="metric-description">
              Fleet productivity
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-item-icon">📍</div>
            <div className="metric-item-content">
              <div className="metric-item-value">{formatDistance(metrics.totalDistance)}</div>
              <div className="metric-item-label">Distance Today</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-item-icon">⏱️</div>
            <div className="metric-item-content">
              <div className="metric-item-value">{formatDuration(metrics.activeHours)}</div>
              <div className="metric-item-label">Active Hours</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-item-icon">🚀</div>
            <div className="metric-item-content">
              <div className="metric-item-value">{formatSpeed(metrics.averageSpeed)}</div>
              <div className="metric-item-label">Avg Speed</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-item-icon">🏆</div>
            <div className="metric-item-content">
              <div className="metric-item-value">{metrics.mostActive.name}</div>
              <div className="metric-item-label">Most Active</div>
              <div className="metric-item-badge">{metrics.mostActive.activity}</div>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="performance-bar">
          <div className="performance-label">
            <span>Overall Performance</span>
            <span>{metrics.utilization >= 70 ? 'Excellent' : metrics.utilization >= 40 ? 'Good' : 'Needs Attention'}</span>
          </div>
          <div className="performance-track">
            <div
              className="performance-fill"
              style={{
                width: `${metrics.utilization}%`,
                backgroundColor: getUtilizationColor()
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FleetMetrics;
