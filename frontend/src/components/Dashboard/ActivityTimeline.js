import React, { useState, useEffect } from 'react';
import './AnalyticsComponents.css';
import { formatCoordinate, formatPercentage, formatNumber } from '../../utils/formatters';

function ActivityTimeline({ forklifts }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      // Generate timeline from forklift data
      const timelineActivities = forklifts.map((forklift, index) => {
        const lastSeen = new Date(forklift.lastSeen);
        const now = new Date();
        const minutesAgo = Math.floor((now - lastSeen) / 60000);
        
        return {
          id: forklift._id,
          forkliftName: forklift.name,
          activity: forklift.currentActivity || 'UNKNOWN',
          timestamp: lastSeen,
          minutesAgo: minutesAgo,
          battery: forklift.batteryLevel || 0,
          location: forklift.currentLocation
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      setActivities(timelineActivities.slice(0, 10)); // Show last 10 activities
    }
  }, [forklifts]);

  const getActivityIcon = (activity) => {
    const icons = {
      DRIVING: '🚗',
      WORKING: '⚙️',
      IDLE: '⏸️',
      PARKED: '🅿️',
      CHARGING: '🔋',
      UNKNOWN: '❓'
    };
    return icons[activity] || icons.UNKNOWN;
  };

  const getActivityColor = (activity) => {
    const colors = {
      DRIVING: '#3b82f6',
      WORKING: '#10b981',
      IDLE: '#f59e0b',
      PARKED: '#6b7280',
      CHARGING: '#8b5cf6',
      UNKNOWN: '#9ca3af'
    };
    return colors[activity] || colors.UNKNOWN;
  };

  const getActivityText = (activity, minutesAgo) => {
    const actions = {
      DRIVING: 'is driving',
      WORKING: 'is working',
      IDLE: 'is idle',
      PARKED: 'is parked',
      CHARGING: 'is charging'
    };
    const action = actions[activity] || 'status unknown';
    const timeText = minutesAgo === 0 ? 'just now' : 
                     minutesAgo === 1 ? '1 minute ago' : 
                     minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                     `${Math.floor(minutesAgo / 60)} hours ago`;
    return { action, timeText };
  };

  const getBatteryIcon = (level) => {
    if (level >= 75) return '🔋';
    if (level >= 50) return '🔋';
    if (level >= 25) return '🪫';
    return '⚠️';
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">📋 Activity Timeline</h3>
        <p className="chart-subtitle">Recent fleet activities</p>
      </div>

      <div className="activity-timeline">
        {activities.length === 0 ? (
          <div className="timeline-empty">
            <span className="empty-icon">📭</span>
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="timeline-list">
            {activities.map((activity, index) => {
              const { action, timeText } = getActivityText(activity.activity, activity.minutesAgo);
              return (
                <div key={activity.id} className="timeline-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div 
                    className="timeline-marker"
                    style={{ backgroundColor: getActivityColor(activity.activity) }}
                  >
                    {getActivityIcon(activity.activity)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-forklift">{activity.forkliftName}</span>
                      <span className="timeline-time">{timeText}</span>
                    </div>
                    <div className="timeline-details">
                      <span className="timeline-action">{action}</span>
                      {activity.location && (
                        <span className="timeline-location">
                          📍 {formatCoordinate(activity.location.latitude)}, {formatCoordinate(activity.location.longitude)}
                        </span>
                      )}
                    </div>
                    <div className="timeline-footer">
                      <span className="timeline-battery">
                        {getBatteryIcon(activity.battery)} {formatPercentage(activity.battery)}
                      </span>
                      <span 
                        className="timeline-badge"
                        style={{ 
                          backgroundColor: `${getActivityColor(activity.activity)}15`,
                          color: getActivityColor(activity.activity)
                        }}
                      >
                        {activity.activity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activities.length > 0 && (
          <div className="timeline-footer-info">
            <span className="footer-text">Showing last {formatNumber(activities.length)} activities</span>
            <button className="view-all-btn">View All →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityTimeline;
