import React, { useState, useEffect } from 'react';
import './AnalyticsComponents.css';
import { formatNumber, formatPercentage } from '../../utils/formatters';

function BatteryTrends({ forklifts }) {
  const [batteryStats, setBatteryStats] = useState({
    average: 0,
    lowest: 100,
    highest: 0,
    critical: 0,
    warning: 0,
    good: 0
  });

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      const levels = forklifts.map(f => f.batteryLevel || 0);
      const avg = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      
      const stats = {
        average: Math.round(avg),
        lowest: Math.min(...levels),
        highest: Math.max(...levels),
        critical: levels.filter(l => l < 20).length,
        warning: levels.filter(l => l >= 20 && l < 50).length,
        good: levels.filter(l => l >= 50).length
      };

      setBatteryStats(stats);
    }
  }, [forklifts]);

  const getBatteryStatus = () => {
    if (batteryStats.average >= 70) return { text: 'Excellent', color: '#10b981' };
    if (batteryStats.average >= 50) return { text: 'Good', color: '#3b82f6' };
    if (batteryStats.average >= 30) return { text: 'Fair', color: '#f59e0b' };
    return { text: 'Critical', color: '#ef4444' };
  };

  const status = getBatteryStatus();

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">🔋 Battery Status</h3>
        <p className="chart-subtitle">Fleet power overview</p>
      </div>

      <div className="battery-trends">
        {/* Average Battery Gauge */}
        <div className="battery-gauge">
          <div className="gauge-circle">
            <svg viewBox="0 0 100 100" className="gauge-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={status.color}
                strokeWidth="8"
                strokeDasharray={`${batteryStats.average * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="gauge-progress"
              />
            </svg>
            <div className="gauge-label">
              <div className="gauge-value">{formatPercentage(batteryStats.average)}</div>
              <div className="gauge-status" style={{ color: status.color }}>
                {status.text}
              </div>
            </div>
          </div>
          <p className="gauge-title">Average Level</p>
        </div>

        {/* Battery Stats Grid */}
        <div className="battery-stats-grid">
          <div className="battery-stat">
            <div className="stat-icon high">↑</div>
            <div className="stat-content">
              <span className="stat-value">{formatPercentage(batteryStats.highest)}</span>
              <span className="stat-label">Highest</span>
            </div>
          </div>

          <div className="battery-stat">
            <div className="stat-icon low">↓</div>
            <div className="stat-content">
              <span className="stat-value">{formatPercentage(batteryStats.lowest)}</span>
              <span className="stat-label">Lowest</span>
            </div>
          </div>

          <div className="battery-stat">
            <div className="stat-icon good">✓</div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(batteryStats.good)}</span>
              <span className="stat-label">Good (≥50%)</span>
            </div>
          </div>

          <div className="battery-stat">
            <div className="stat-icon warning">⚠</div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(batteryStats.warning)}</span>
              <span className="stat-label">Warning (20-49%)</span>
            </div>
          </div>

          <div className="battery-stat">
            <div className="stat-icon critical">⚠</div>
            <div className="stat-content">
              <span className="stat-value">{formatNumber(batteryStats.critical)}</span>
              <span className="stat-label">Critical (&lt;20%)</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {batteryStats.critical > 0 && (
          <div className="battery-alert critical">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              {formatNumber(batteryStats.critical)} forklift{batteryStats.critical > 1 ? 's' : ''} need{batteryStats.critical === 1 ? 's' : ''} charging
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BatteryTrends;
