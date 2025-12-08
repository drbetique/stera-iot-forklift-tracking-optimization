import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './ImpactEventsPanel.css';

const ImpactEventsPanel = () => {
  const [impactEvents, setImpactEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedForklift, setSelectedForklift] = useState('all');

  const fetchImpactEvents = useCallback(async () => {
    try {
      setLoading(true);
      const options = {
        limit: 20,
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(selectedForklift !== 'all' && { forkliftId: selectedForklift })
      };

      const events = await api.getImpactEvents(options);
      setImpactEvents(events);
    } catch (error) {
      console.error('Error fetching impact events:', error);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, selectedForklift]);

  useEffect(() => {
    fetchImpactEvents();
    const interval = setInterval(fetchImpactEvents, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchImpactEvents]);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '⚪';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getUniqueForkliftIds = () => {
    const ids = new Set(impactEvents.map(event => event.forkliftId));
    return Array.from(ids).sort();
  };

  return (
    <div className="impact-events-panel">
      <div className="panel-header">
        <div className="header-title">
          <h3>⚠️ Impact Events</h3>
          <p className="header-subtitle">Real-time collision and impact alerts</p>
        </div>

        <div className="panel-filters">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <select
            value={selectedForklift}
            onChange={(e) => setSelectedForklift(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Forklifts</option>
            {getUniqueForkliftIds().map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && impactEvents.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading impact events...</p>
        </div>
      ) : impactEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h4>No Impact Events</h4>
          <p>No impacts detected in the selected filters</p>
        </div>
      ) : (
        <div className="events-list">
          {impactEvents.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className="event-card"
              style={{ borderLeftColor: getSeverityColor(event.severity) }}
            >
              <div className="event-header">
                <div className="event-severity">
                  <span className="severity-icon">{getSeverityIcon(event.severity)}</span>
                  <span className="severity-label" style={{ color: getSeverityColor(event.severity) }}>
                    {event.severity?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <span className="event-time">{formatTimestamp(event.timestamp)}</span>
              </div>

              <div className="event-details">
                <div className="detail-row">
                  <span className="detail-label">🚜 Forklift:</span>
                  <span className="detail-value">{event.forkliftId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">💥 Impact Force:</span>
                  <span className="detail-value impact-force">
                    {event.accelTotalG?.toFixed(2) || 'N/A'}g
                  </span>
                </div>

                {event.activity && (
                  <div className="detail-row">
                    <span className="detail-label">⚙️ Activity:</span>
                    <span className={`detail-value activity-badge activity-${event.activity?.toLowerCase()}`}>
                      {event.activity}
                    </span>
                  </div>
                )}

                {event.location && (event.location.latitude || event.location.longitude) && (
                  <div className="detail-row">
                    <span className="detail-label">📍 Location:</span>
                    <span className="detail-value location-coords">
                      {event.location.latitude?.toFixed(6)}, {event.location.longitude?.toFixed(6)}
                    </span>
                  </div>
                )}

                <div className="acceleration-details">
                  <span className="accel-label">Acceleration Vector:</span>
                  <div className="accel-values">
                    <span className="accel-axis">X: {event.accelX?.toFixed(2)}g</span>
                    <span className="accel-axis">Y: {event.accelY?.toFixed(2)}g</span>
                    <span className="accel-axis">Z: {event.accelZ?.toFixed(2)}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel-footer">
        <span className="event-count">
          Showing {impactEvents.length} {impactEvents.length === 1 ? 'event' : 'events'}
        </span>
        <button onClick={fetchImpactEvents} className="refresh-button" disabled={loading}>
          {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
    </div>
  );
};

export default ImpactEventsPanel;
