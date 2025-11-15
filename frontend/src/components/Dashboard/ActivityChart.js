import React, { useState, useEffect } from 'react';
import './AnalyticsComponents.css';
import { formatNumber, formatPercentage } from '../../utils/formatters';

function ActivityChart({ forklifts }) {
  const [activityData, setActivityData] = useState({
    DRIVING: 0,
    WORKING: 0,
    IDLE: 0,
    PARKED: 0,
    CHARGING: 0
  });

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      const activities = {
        DRIVING: 0,
        WORKING: 0,
        IDLE: 0,
        PARKED: 0,
        CHARGING: 0
      };

      forklifts.forEach(forklift => {
        const activity = forklift.currentActivity || 'UNKNOWN';
        if (activities.hasOwnProperty(activity)) {
          activities[activity]++;
        }
      });

      setActivityData(activities);
    }
  }, [forklifts]);

  const getActivityColor = (activity) => {
    const colors = {
      DRIVING: '#3b82f6',
      WORKING: '#10b981',
      IDLE: '#f59e0b',
      PARKED: '#6b7280',
      CHARGING: '#8b5cf6'
    };
    return colors[activity] || '#9ca3af';
  };

  const getActivityIcon = (activity) => {
    const icons = {
      DRIVING: '🚗',
      WORKING: '⚙️',
      IDLE: '⏸️',
      PARKED: '🅿️',
      CHARGING: '🔋'
    };
    return icons[activity] || '❓';
  };

  const total = Object.values(activityData).reduce((sum, val) => sum + val, 0);
  const getPercentage = (value) => total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">📊 Real-Time Activity Distribution</h3>
        <p className="chart-subtitle">Current fleet status breakdown</p>
      </div>

      <div className="activity-chart">
        <div className="chart-bars">
          {Object.entries(activityData).map(([activity, count]) => {
            const percentage = getPercentage(count);
            return (
              <div key={activity} className="chart-bar-row">
                <div className="bar-label">
                  <span className="bar-icon">{getActivityIcon(activity)}</span>
                  <span className="bar-name">{activity}</span>
                  <span className="bar-count">{formatNumber(count)}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getActivityColor(activity)
                    }}
                  >
                    <span className="bar-percentage">{formatPercentage(percentage)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chart-summary">
          <div className="summary-stat">
            <span className="summary-label">Total Active</span>
            <span className="summary-value">{formatNumber(total)}</span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Productive</span>
            <span className="summary-value productive">
              {formatNumber(activityData.DRIVING + activityData.WORKING)}
            </span>
          </div>
          <div className="summary-stat">
            <span className="summary-label">Standby</span>
            <span className="summary-value warning">
              {formatNumber(activityData.IDLE + activityData.PARKED)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityChart;
