import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import './ForkliftDetailsModal.css';
import {
  formatTime,
  formatCoordinate,
  formatPercentage,
  capitalize,
  getBatteryIcon,
  getActivityIcon,
  getActivityColor,
  getBatteryColor
} from '../../utils/formatters';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for forklift on map
const createForkliftIcon = (activity) => {
  const colors = {
    'DRIVING': '#3b82f6',
    'WORKING': '#10b981',
    'IDLE': '#f59e0b',
    'PARKED': '#6b7280',
    'CHARGING': '#8b5cf6',
    'UNKNOWN': '#9ca3af'
  };

  const color = colors[activity] || colors.UNKNOWN;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 18px;
          margin-top: 3px;
          margin-left: 6px;
        ">🚜</div>
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  });
};

const ForkliftDetailsModal = ({ forklift, onClose }) => {
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [impactEvents, setImpactEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, sensors, activity, history

  const fetchData = useCallback(async () => {
    if (!forklift) return;

    try {
      setLoading(true);

      // Fetch latest telemetry
      const telemetry = await api.getForkliftLatestTelemetry(forklift.forkliftId);
      setLatestTelemetry(telemetry);

      // Fetch latest sensor data from InfluxDB
      const sensorData = await api.getLatestSensorData(forklift.forkliftId);

      // Fetch sensor history (last 50 readings)
      const history = await api.getSensorHistory(forklift.forkliftId, { limit: 50 });
      setSensorHistory(history);

      // Fetch recent impact events for this forklift
      const impacts = await api.getImpactEvents({ forkliftId: forklift.forkliftId, limit: 10 });
      setImpactEvents(impacts);

    } catch (error) {
      console.error('Error fetching forklift data:', error);
    } finally {
      setLoading(false);
    }
  }, [forklift]);

  useEffect(() => {
    fetchData();
    // Refresh data every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Calculate operational metrics
  const calculateWorkingTime = () => {
    if (!latestTelemetry || !latestTelemetry.timestamp) return 'N/A';

    const now = new Date();
    const lastUpdate = new Date(latestTelemetry.timestamp);
    const diffMs = now - lastUpdate;

    if (forklift.currentActivity === 'WORKING' || forklift.currentActivity === 'DRIVING') {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Active for ${hours}h ${minutes}m`;
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) return `Idle for ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `Idle for ${hours}h ${minutes % 60}m`;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  if (!forklift) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="forklift-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <span className="forklift-icon-large">🚜</span>
            <div>
              <h2>{forklift.name || 'Unnamed Forklift'}</h2>
              <p className="details-id">{forklift.forkliftId}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'sensors' ? 'active' : ''}`}
            onClick={() => setActiveTab('sensors')}
          >
            📡 Sensors
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            ⚙️ Activity
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading && !latestTelemetry ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading forklift data...</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="tab-content">
                  {/* Location Map */}
                  {forklift.currentLocation && (
                    <div className="section">
                      <h3>📍 Current Location</h3>
                      <div className="forklift-map-container">
                        <MapContainer
                          center={[forklift.currentLocation.latitude, forklift.currentLocation.longitude]}
                          zoom={17}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[forklift.currentLocation.latitude, forklift.currentLocation.longitude]}
                            icon={createForkliftIcon(forklift.currentActivity)}
                          >
                            <Popup>
                              <div style={{ textAlign: 'center' }}>
                                <strong>{forklift.name}</strong><br />
                                {forklift.currentActivity}<br />
                                Battery: {forklift.batteryLevel}%
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                        <div className="map-coordinates">
                          <span className="coord-label">Coordinates:</span>
                          <span className="coord-value">
                            {formatCoordinate(forklift.currentLocation.latitude)}, {formatCoordinate(forklift.currentLocation.longitude)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Metrics Cards */}
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon">⚙️</div>
                      <div className="metric-content">
                        <h4>Current Activity</h4>
                        <span
                          className="metric-value activity-badge"
                          style={{ backgroundColor: getActivityColor(forklift.currentActivity) }}
                        >
                          {getActivityIcon(forklift.currentActivity)} {forklift.currentActivity}
                        </span>
                        <p className="metric-description">{calculateWorkingTime()}</p>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon" style={{ color: getBatteryColor(forklift.batteryLevel) }}>
                        {getBatteryIcon(forklift.batteryLevel)}
                      </div>
                      <div className="metric-content">
                        <h4>Battery Level</h4>
                        <span className="metric-value" style={{ color: getBatteryColor(forklift.batteryLevel) }}>
                          {formatPercentage(forklift.batteryLevel)}
                        </span>
                        <div className="battery-bar">
                          <div
                            className="battery-fill"
                            style={{
                              width: `${forklift.batteryLevel}%`,
                              backgroundColor: getBatteryColor(forklift.batteryLevel)
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon">📍</div>
                      <div className="metric-content">
                        <h4>Location</h4>
                        {forklift.currentLocation ? (
                          <>
                            <span className="metric-value">
                              {formatCoordinate(forklift.currentLocation.latitude)},
                              {formatCoordinate(forklift.currentLocation.longitude)}
                            </span>
                            <p className="metric-description">Last updated: {formatTime(forklift.lastSeen)}</p>
                          </>
                        ) : (
                          <span className="metric-value">No GPS data</span>
                        )}
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-icon">🔧</div>
                      <div className="metric-content">
                        <h4>Model & Status</h4>
                        <span className="metric-value">{forklift.model || 'N/A'}</span>
                        <span className={`status-badge ${forklift.status?.toLowerCase()}`}>
                          {capitalize(forklift.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Impact Events */}
                  {impactEvents.length > 0 && (
                    <div className="section">
                      <h3>⚠️ Recent Impact Events ({impactEvents.length})</h3>
                      <div className="impact-list">
                        {impactEvents.slice(0, 5).map((event, index) => (
                          <div key={index} className="impact-item" style={{ borderLeftColor: getSeverityColor(event.severity) }}>
                            <div className="impact-header">
                              <span className="impact-severity" style={{ color: getSeverityColor(event.severity) }}>
                                {event.severity?.toUpperCase()}
                              </span>
                              <span className="impact-time">{formatTime(event.timestamp)}</span>
                            </div>
                            <div className="impact-details">
                              <span>💥 Impact: {event.accelTotalG?.toFixed(2)}g</span>
                              <span>⚙️ Activity: {event.activity || 'Unknown'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SENSORS TAB */}
              {activeTab === 'sensors' && latestTelemetry && (
                <div className="tab-content">
                  <div className="sensor-sections">
                    {/* Accelerometer Data */}
                    {latestTelemetry.accelerometer && (
                      <div className="section">
                        <h3>📐 Accelerometer & Gyroscope</h3>
                        <div className="sensor-grid">
                          <div className="sensor-item">
                            <span className="sensor-label">Accel X:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.accel_x?.toFixed(3)}g</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Accel Y:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.accel_y?.toFixed(3)}g</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Accel Z:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.accel_z?.toFixed(3)}g</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Gyro X:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.gyro_x?.toFixed(2)}°/s</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Gyro Y:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.gyro_y?.toFixed(2)}°/s</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Gyro Z:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.gyro_z?.toFixed(2)}°/s</span>
                          </div>
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Vibration:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.vibrationMagnitude?.toFixed(3)}g</span>
                          </div>
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Tilt Angle:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.tiltAngle?.toFixed(2)}°</span>
                          </div>
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Temperature:</span>
                            <span className="sensor-value">{latestTelemetry.accelerometer.temperature?.toFixed(1)}°C</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GPS Data */}
                    {latestTelemetry.gps && (
                      <div className="section">
                        <h3>🛰️ GPS & Navigation</h3>
                        <div className="sensor-grid">
                          <div className="sensor-item">
                            <span className="sensor-label">Latitude:</span>
                            <span className="sensor-value">{latestTelemetry.gps.latitude?.toFixed(6)}</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Longitude:</span>
                            <span className="sensor-value">{latestTelemetry.gps.longitude?.toFixed(6)}</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Altitude:</span>
                            <span className="sensor-value">{latestTelemetry.gps.altitude?.toFixed(2)}m</span>
                          </div>
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Speed:</span>
                            <span className="sensor-value">{latestTelemetry.gps.speed?.toFixed(2)} km/h</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Satellites:</span>
                            <span className="sensor-value">{latestTelemetry.gps.satellites}</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">GPS Valid:</span>
                            <span className={`sensor-value ${latestTelemetry.gps.valid ? 'valid' : 'invalid'}`}>
                              {latestTelemetry.gps.valid ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ultrasonic Sensors */}
                    {latestTelemetry.ultrasonic && (
                      <div className="section">
                        <h3>📏 Ultrasonic Sensors</h3>
                        <div className="sensor-grid">
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Fork Height:</span>
                            <span className="sensor-value">{latestTelemetry.ultrasonic.forkHeight?.toFixed(1)} cm</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Load Distance:</span>
                            <span className="sensor-value">{latestTelemetry.ultrasonic.loadDistance?.toFixed(1)} cm</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Front Obstacle:</span>
                            <span className="sensor-value">{latestTelemetry.ultrasonic.frontObstacle?.toFixed(1)} cm</span>
                          </div>
                          <div className="sensor-item">
                            <span className="sensor-label">Rear Obstacle:</span>
                            <span className="sensor-value">{latestTelemetry.ultrasonic.rearObstacle?.toFixed(1)} cm</span>
                          </div>
                          <div className="sensor-item highlight">
                            <span className="sensor-label">Load Detected:</span>
                            <span className={`sensor-value ${latestTelemetry.ultrasonic.loadDetected ? 'valid' : 'invalid'}`}>
                              {latestTelemetry.ultrasonic.loadDetected ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RFID Data */}
                    {latestTelemetry.rfid && (
                      <div className="section">
                        <h3>🏷️ RFID Scanner</h3>
                        <div className="sensor-grid">
                          <div className="sensor-item">
                            <span className="sensor-label">Tag Detected:</span>
                            <span className={`sensor-value ${latestTelemetry.rfid.tagDetected ? 'valid' : 'invalid'}`}>
                              {latestTelemetry.rfid.tagDetected ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          {latestTelemetry.rfid.tagDetected && (
                            <div className="sensor-item highlight">
                              <span className="sensor-label">Tag ID:</span>
                              <span className="sensor-value">{latestTelemetry.rfid.tagId || 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === 'activity' && latestTelemetry && latestTelemetry.activity && (
                <div className="tab-content">
                  <div className="section">
                    <h3>⚙️ Activity Status</h3>
                    <div className="activity-details">
                      <div className="activity-card">
                        <div className="activity-icon" style={{ backgroundColor: getActivityColor(latestTelemetry.activity.state) }}>
                          {getActivityIcon(latestTelemetry.activity.state)}
                        </div>
                        <div className="activity-info">
                          <h4>Current State</h4>
                          <p className="activity-state">{latestTelemetry.activity.state}</p>
                          <p className="activity-time">{calculateWorkingTime()}</p>
                        </div>
                      </div>

                      <div className="activity-grid">
                        <div className="activity-item">
                          <span className="activity-label">Fork Status:</span>
                          <span className={`activity-value ${latestTelemetry.activity.forkState?.toLowerCase()}`}>
                            {latestTelemetry.activity.forkState === 'RAISED' ? '⬆️' : '⬇️'} {latestTelemetry.activity.forkState}
                          </span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-label">Engine:</span>
                          <span className={`activity-value ${latestTelemetry.activity.engineOn ? 'on' : 'off'}`}>
                            {latestTelemetry.activity.engineOn ? '🟢 On' : '🔴 Off'}
                          </span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-label">In Motion:</span>
                          <span className={`activity-value ${latestTelemetry.activity.inMotion ? 'moving' : 'stopped'}`}>
                            {latestTelemetry.activity.inMotion ? '🔄 Yes' : '⏸️ No'}
                          </span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-label">Movement Detected:</span>
                          <span className={`activity-value ${latestTelemetry.accelerometer?.movementDetected ? 'moving' : 'stopped'}`}>
                            {latestTelemetry.accelerometer?.movementDetected ? '✓ Yes' : '✗ No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="tab-content">
                  <div className="section">
                    <h3>📜 Sensor Data History</h3>
                    {sensorHistory.length > 0 ? (
                      <div className="history-table-container">
                        <table className="history-table">
                          <thead>
                            <tr>
                              <th>Timestamp</th>
                              <th>Activity</th>
                              <th>Battery</th>
                              <th>Speed</th>
                              <th>Vibration</th>
                              <th>Fork Height</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensorHistory.slice(0, 20).map((record, index) => (
                              <tr key={index}>
                                <td>{formatTime(record.timestamp)}</td>
                                <td>
                                  <span className="history-badge" style={{ backgroundColor: getActivityColor(record.activity?.state) }}>
                                    {record.activity?.state || 'N/A'}
                                  </span>
                                </td>
                                <td>{record.batteryLevel ? formatPercentage(record.batteryLevel) : 'N/A'}</td>
                                <td>{record.gps?.speed?.toFixed(1) || '0.0'} km/h</td>
                                <td>{record.accelerometer?.vibrationMagnitude?.toFixed(3) || 'N/A'}g</td>
                                <td>{record.ultrasonic?.forkHeight?.toFixed(0) || 'N/A'} cm</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <p>No historical data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="refresh-btn-modal" onClick={fetchData} disabled={loading}>
            {loading ? '⏳ Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button className="close-btn-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ForkliftDetailsModal;
