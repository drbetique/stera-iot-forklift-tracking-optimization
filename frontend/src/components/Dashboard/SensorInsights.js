import React from 'react';
import './SensorInsights.css';

const SensorInsights = ({ forklift }) => {
  if (!forklift || !forklift.lastTelemetry) {
    return null;
  }

  const telemetry = forklift.lastTelemetry;
  const accel = telemetry.accelerometer || {};

  // Calculate insights
  const insights = calculateInsights(accel, telemetry);

  return (
    <div className="sensor-insights">
      <div className="insights-header">
        <h3>📊 Sensor Insights - {forklift.name}</h3>
        <span className="last-update">
          Last updated: {new Date(telemetry.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="insights-grid">
        {/* Health Score */}
        <div className={`insight-card health-score ${insights.health.status}`}>
          <div className="insight-icon">{insights.health.icon}</div>
          <div className="insight-content">
            <h4>Overall Health</h4>
            <div className="health-bar">
              <div
                className="health-fill"
                style={{ width: `${insights.health.score}%` }}
              />
            </div>
            <p className="insight-value">{insights.health.score}%</p>
            <p className="insight-description">{insights.health.message}</p>
          </div>
        </div>

        {/* Vibration Status */}
        <div className={`insight-card vibration ${insights.vibration.level}`}>
          <div className="insight-icon">{insights.vibration.icon}</div>
          <div className="insight-content">
            <h4>Vibration Level</h4>
            <p className="insight-value">{insights.vibration.label}</p>
            <p className="insight-description">{insights.vibration.message}</p>
            <div className="metric-detail">
              {(accel.vibrationMagnitude || 0).toFixed(2)}g
            </div>
          </div>
        </div>

        {/* Temperature Status */}
        <div className={`insight-card temperature ${insights.temperature.level}`}>
          <div className="insight-icon">{insights.temperature.icon}</div>
          <div className="insight-content">
            <h4>Temperature</h4>
            <p className="insight-value">{insights.temperature.label}</p>
            <p className="insight-description">{insights.temperature.message}</p>
            <div className="metric-detail">
              {accel.temperature ? `${accel.temperature.toFixed(1)}°C` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Movement Pattern */}
        <div className={`insight-card movement ${insights.movement.level}`}>
          <div className="insight-icon">{insights.movement.icon}</div>
          <div className="insight-content">
            <h4>Movement Pattern</h4>
            <p className="insight-value">{insights.movement.label}</p>
            <p className="insight-description">{insights.movement.message}</p>
          </div>
        </div>

        {/* Tilt Status */}
        <div className={`insight-card tilt ${insights.tilt.level}`}>
          <div className="insight-icon">{insights.tilt.icon}</div>
          <div className="insight-content">
            <h4>Tilt Angle</h4>
            <p className="insight-value">{insights.tilt.angle}°</p>
            <p className="insight-description">{insights.tilt.message}</p>
          </div>
        </div>

        {/* Impact Detection */}
        {insights.impact.detected && (
          <div className="insight-card impact-alert">
            <div className="insight-icon pulse">⚠️</div>
            <div className="insight-content">
              <h4>Impact Detected!</h4>
              <p className="insight-value">{insights.impact.severity}</p>
              <p className="insight-description">{insights.impact.message}</p>
              <div className="metric-detail">
                Force: {insights.impact.force}g
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-label">Acceleration</span>
          <span className="stat-value">
            X: {(accel.accelX || 0).toFixed(2)}g
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Y Axis</span>
          <span className="stat-value">
            Y: {(accel.accelY || 0).toFixed(2)}g
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Z Axis</span>
          <span className="stat-value">
            Z: {(accel.accelZ || 0).toFixed(2)}g
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Activity</span>
          <span className={`stat-value activity-${telemetry.activity?.state?.toLowerCase()}`}>
            {telemetry.activity?.state || 'UNKNOWN'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Calculate human-readable insights from sensor data
const calculateInsights = (accel, telemetry) => {
  const vibration = accel.vibrationMagnitude || 0;
  const temp = accel.temperature || 25;
  const accel_x = Math.abs(accel.accelX || 0);
  const accel_y = Math.abs(accel.accelY || 0);
  const accel_z = Math.abs(accel.accelZ || 1);

  // Calculate tilt angle (from vertical)
  const tiltAngle = Math.acos(accel_z / vibration) * (180 / Math.PI);

  // Health Score Calculation (0-100)
  let healthScore = 100;

  // Deduct points for issues
  if (vibration > 2.0) healthScore -= 20; // High vibration
  if (vibration > 3.0) healthScore -= 20; // Very high vibration
  if (temp > 35) healthScore -= 15; // High temperature
  if (temp > 45) healthScore -= 25; // Very high temperature
  if (tiltAngle > 30) healthScore -= 15; // Excessive tilt
  if (tiltAngle > 45) healthScore -= 20; // Dangerous tilt

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Health Status
  const health = {
    score: healthScore,
    status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor',
    icon: healthScore >= 80 ? '💚' : healthScore >= 60 ? '💛' : healthScore >= 40 ? '🧡' : '❤️',
    message: healthScore >= 80
      ? 'All systems operating normally'
      : healthScore >= 60
      ? 'Minor issues detected, monitoring...'
      : healthScore >= 40
      ? 'Some issues require attention'
      : 'Multiple issues detected - inspect soon'
  };

  // Vibration Analysis
  const vibrationInsight = {
    level: vibration < 1.5 ? 'smooth' : vibration < 2.5 ? 'normal' : vibration < 4.0 ? 'rough' : 'very-rough',
    label: vibration < 1.5 ? 'Smooth' : vibration < 2.5 ? 'Normal' : vibration < 4.0 ? 'Rough' : 'Very Rough',
    icon: vibration < 1.5 ? '✨' : vibration < 2.5 ? '📊' : vibration < 4.0 ? '⚡' : '🔴',
    message: vibration < 1.5
      ? 'Operating on smooth surface'
      : vibration < 2.5
      ? 'Normal operation, typical vibration'
      : vibration < 4.0
      ? 'Rough surface or aggressive driving'
      : 'Excessive vibration - check load and surface'
  };

  // Temperature Analysis
  const temperatureInsight = {
    level: temp < 25 ? 'cool' : temp < 35 ? 'normal' : temp < 45 ? 'warm' : 'hot',
    label: temp < 25 ? 'Cool' : temp < 35 ? 'Normal' : temp < 45 ? 'Warm' : 'Hot',
    icon: temp < 25 ? '❄️' : temp < 35 ? '🌡️' : temp < 45 ? '🌡️' : '🔥',
    message: temp < 25
      ? 'Sensor temperature is cool'
      : temp < 35
      ? 'Operating at normal temperature'
      : temp < 45
      ? 'Running warm - ensure good ventilation'
      : 'High temperature detected - check cooling'
  };

  // Movement Pattern
  const activity = telemetry.activity?.state || 'UNKNOWN';
  const movementInsight = {
    level: activity.toLowerCase(),
    label: activity,
    icon: activity === 'PARKED' ? '🅿️'
        : activity === 'IDLE' ? '⏸️'
        : activity === 'DRIVING' ? '🚗'
        : activity === 'WORKING' ? '🏗️'
        : '❓',
    message: activity === 'PARKED'
      ? 'Forklift is stationary and powered off'
      : activity === 'IDLE'
      ? 'Forklift is on but not moving'
      : activity === 'DRIVING'
      ? 'Forklift is in motion'
      : activity === 'WORKING'
      ? 'Actively loading or unloading'
      : 'Activity status unknown'
  };

  // Tilt Analysis
  const tiltInsight = {
    angle: tiltAngle.toFixed(1),
    level: tiltAngle < 15 ? 'safe' : tiltAngle < 30 ? 'caution' : 'danger',
    icon: tiltAngle < 15 ? '📐' : tiltAngle < 30 ? '⚠️' : '🚨',
    message: tiltAngle < 15
      ? 'Forklift is level and stable'
      : tiltAngle < 30
      ? 'Moderate tilt detected - drive carefully'
      : 'Excessive tilt - risk of tipping over!'
  };

  // Impact Detection (>2.5g threshold)
  const maxAccel = Math.max(accel_x, accel_y, accel_z);
  const impactDetected = maxAccel > 2.5;

  const impactInsight = {
    detected: impactDetected,
    force: maxAccel.toFixed(2),
    severity: maxAccel > 5.0 ? 'Severe Impact'
            : maxAccel > 4.0 ? 'Strong Impact'
            : maxAccel > 3.0 ? 'Moderate Impact'
            : 'Minor Impact',
    message: maxAccel > 5.0
      ? 'Major collision detected! Inspect immediately'
      : maxAccel > 4.0
      ? 'Strong impact - check for damage'
      : maxAccel > 3.0
      ? 'Impact detected - verify forklift condition'
      : 'Minor bump or shock detected'
  };

  return {
    health,
    vibration: vibrationInsight,
    temperature: temperatureInsight,
    movement: movementInsight,
    tilt: tiltInsight,
    impact: impactInsight
  };
};

export default SensorInsights;
