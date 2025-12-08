import React from 'react';
import './SensorMetrics.css';

/**
 * SensorMetrics Component
 * Displays MPU6050 accelerometer and gyroscope data with visual indicators
 */
function SensorMetrics({ telemetry }) {
  if (!telemetry || !telemetry.accelerometer) {
    return (
      <div className="sensor-metrics">
        <div className="sensor-metrics-header">
          <h3>Sensor Data</h3>
        </div>
        <div className="no-sensor-data">
          <p>No sensor data available</p>
        </div>
      </div>
    );
  }

  const { accelerometer } = telemetry;

  // Helper function to format sensor values
  const formatValue = (value, decimals = 3) => {
    if (value === undefined || value === null) return 'N/A';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };

  // Get vibration severity level
  const getVibrationLevel = (vibration) => {
    if (!vibration) return { level: 'unknown', label: 'Unknown' };
    if (vibration < 0.05) return { level: 'low', label: 'Low' };
    if (vibration < 0.15) return { level: 'medium', label: 'Medium' };
    return { level: 'high', label: 'High' };
  };

  // Get tilt severity level
  const getTiltLevel = (tilt) => {
    if (!tilt) return { level: 'unknown', label: 'Unknown' };
    if (tilt < 10) return { level: 'low', label: 'Normal' };
    if (tilt < 30) return { level: 'medium', label: 'Tilted' };
    return { level: 'high', label: 'Warning' };
  };

  const vibrationInfo = getVibrationLevel(accelerometer.vibrationMagnitude);
  const tiltInfo = getTiltLevel(accelerometer.tiltAngle);

  return (
    <div className="sensor-metrics">
      <div className="sensor-metrics-header">
        <h3>Sensor Data (MPU6050)</h3>
        <span className={`sensor-status ${accelerometer.movementDetected ? 'moving' : 'stationary'}`}>
          {accelerometer.movementDetected ? '🟢 Moving' : '⚪ Stationary'}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="sensor-key-metrics">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Vibration</div>
            <div className={`metric-value vibration-${vibrationInfo.level}`}>
              {formatValue(accelerometer.vibrationMagnitude, 3)}g
            </div>
            <div className="metric-sublabel">{vibrationInfo.label}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📐</div>
          <div className="metric-content">
            <div className="metric-label">Tilt Angle</div>
            <div className={`metric-value tilt-${tiltInfo.level}`}>
              {formatValue(accelerometer.tiltAngle, 1)}°
            </div>
            <div className="metric-sublabel">{tiltInfo.label}</div>
          </div>
        </div>
      </div>

      {/* Detailed Readings */}
      <div className="sensor-details">
        <div className="sensor-group">
          <h4>Accelerometer (g-force)</h4>
          <div className="sensor-readings">
            <div className="sensor-reading">
              <span className="reading-label">X-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.accelX)}</span>
            </div>
            <div className="sensor-reading">
              <span className="reading-label">Y-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.accelY)}</span>
            </div>
            <div className="sensor-reading">
              <span className="reading-label">Z-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.accelZ)}</span>
            </div>
          </div>
        </div>

        <div className="sensor-group">
          <h4>Gyroscope (deg/s)</h4>
          <div className="sensor-readings">
            <div className="sensor-reading">
              <span className="reading-label">X-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.gyroX)}</span>
            </div>
            <div className="sensor-reading">
              <span className="reading-label">Y-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.gyroY)}</span>
            </div>
            <div className="sensor-reading">
              <span className="reading-label">Z-Axis</span>
              <span className="reading-value">{formatValue(accelerometer.gyroZ)}</span>
            </div>
          </div>
        </div>

        {accelerometer.temperature !== undefined && (
          <div className="sensor-group">
            <h4>Temperature</h4>
            <div className="sensor-readings">
              <div className="sensor-reading">
                <span className="reading-label">Sensor Temp</span>
                <span className="reading-value">{formatValue(accelerometer.temperature, 1)}°C</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SensorMetrics;
