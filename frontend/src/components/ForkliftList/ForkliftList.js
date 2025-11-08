import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ForkliftList.css';

function ForkliftList() {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchForklifts();
    // Refresh every 10 seconds
    const interval = setInterval(fetchForklifts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchForklifts = async () => {
    try {
      const response = await api.getAllForklifts();
      if (response.success) {
        setForklifts(response.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch forklifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (activity) => {
    const colors = {
      'DRIVING': '#3b82f6',
      'WORKING': '#10b981',
      'IDLE': '#f59e0b',
      'PARKED': '#6b7280',
      'CHARGING': '#8b5cf6',
      'UNKNOWN': '#9ca3af'
    };
    return colors[activity] || colors.UNKNOWN;
  };

  const getActivityIcon = (activity) => {
    const icons = {
      'DRIVING': '🚗',
      'WORKING': '⚙️',
      'IDLE': '⏸️',
      'PARKED': '🅿️',
      'CHARGING': '🔋',
      'UNKNOWN': '❓'
    };
    return icons[activity] || icons.UNKNOWN;
  };

  const getBatteryColor = (level) => {
    if (level >= 70) return '#10b981';
    if (level >= 40) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="forklift-list">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading forklifts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forklift-list">
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={fetchForklifts}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="forklift-list">
      <div className="list-header">
        <h2>Active Forklifts ({forklifts.length})</h2>
        <button className="refresh-btn" onClick={fetchForklifts}>
          🔄 Refresh
        </button>
      </div>

      {forklifts.length === 0 ? (
        <div className="empty-state">
          <p>No forklifts found</p>
          <p className="empty-hint">Add forklifts to start tracking</p>
        </div>
      ) : (
        <div className="forklift-grid">
          {forklifts.map((forklift) => (
            <div key={forklift._id} className="forklift-card">
              <div className="card-header">
                <div className="forklift-id">
                  <span className="icon">🚜</span>
                  <div>
                    <h3>{forklift.name}</h3>
                    <p className="id-text">{forklift.forkliftId}</p>
                  </div>
                </div>
                <div 
                  className="activity-badge"
                  style={{ backgroundColor: getActivityColor(forklift.currentActivity) }}
                >
                  {getActivityIcon(forklift.currentActivity)} {forklift.currentActivity}
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Model:</span>
                  <span className="value">{forklift.model || 'N/A'}</span>
                </div>

                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${forklift.status}`}>
                    {forklift.status}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Battery:</span>
                  <div className="battery-indicator">
                    <div 
                      className="battery-fill"
                      style={{ 
                        width: `${forklift.batteryLevel || 0}%`,
                        backgroundColor: getBatteryColor(forklift.batteryLevel || 0)
                      }}
                    ></div>
                    <span className="battery-text">{forklift.batteryLevel || 0}%</span>
                  </div>
                </div>

                {forklift.currentLocation && (
                  <div className="info-row">
                    <span className="label">Location:</span>
                    <span className="value location">
                      📍 {forklift.currentLocation.latitude.toFixed(4)}, 
                      {forklift.currentLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                <div className="info-row">
                  <span className="label">Last Seen:</span>
                  <span className="value">
                    {new Date(forklift.lastSeen).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <button className="detail-btn">View Details →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ForkliftList;