import React, { useState, useEffect } from 'react';
import './ImpactAlert.css';

const ImpactAlert = ({ forklifts }) => {
  const [alerts, setAlerts] = useState([]);
  const [impactHistory, setImpactHistory] = useState([]);

  useEffect(() => {
    if (!forklifts || forklifts.length === 0) return;

    // Check each forklift for impacts
    forklifts.forEach((forklift) => {
      if (!forklift.lastTelemetry) return;

      const accel = forklift.lastTelemetry.accelerometer || {};
      const maxAccel = Math.max(
        Math.abs(accel.accel_x || 0),
        Math.abs(accel.accel_y || 0),
        Math.abs(accel.accel_z || 0)
      );

      // Impact threshold: 2.5g
      if (maxAccel > 2.5) {
        const impactId = `${forklift.forkliftId}-${forklift.lastTelemetry.timestamp}`;

        // Check if this impact was already recorded
        const alreadyRecorded = impactHistory.includes(impactId);

        if (!alreadyRecorded) {
          const severity = maxAccel > 5.0 ? 'severe'
                         : maxAccel > 4.0 ? 'strong'
                         : maxAccel > 3.0 ? 'moderate'
                         : 'minor';

          const newAlert = {
            id: impactId,
            forkliftId: forklift.forkliftId,
            forkliftName: forklift.name,
            timestamp: new Date(forklift.lastTelemetry.timestamp),
            force: maxAccel.toFixed(2),
            severity,
            location: forklift.currentLocation
          };

          // Add to alerts
          setAlerts((prev) => [newAlert, ...prev].slice(0, 5)); // Keep last 5 alerts

          // Add to history
          setImpactHistory((prev) => [impactId, ...prev].slice(0, 20));

          // Auto-dismiss after 10 seconds
          setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.id !== impactId));
          }, 10000);
        }
      }
    });
  }, [forklifts, impactHistory]);

  const dismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'severe': return '🚨';
      case 'strong': return '⚠️';
      case 'moderate': return '⚡';
      case 'minor': return '⚠️';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'severe': return '#dc2626';
      case 'strong': return '#f97316';
      case 'moderate': return '#f59e0b';
      case 'minor': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'severe': return 'SEVERE IMPACT';
      case 'strong': return 'Strong Impact';
      case 'moderate': return 'Moderate Impact';
      case 'minor': return 'Minor Impact';
      default: return 'Impact Detected';
    }
  };

  const getSeverityMessage = (severity) => {
    switch (severity) {
      case 'severe': return 'Major collision detected! Immediate inspection required.';
      case 'strong': return 'Strong impact detected. Check forklift for damage.';
      case 'moderate': return 'Impact detected. Verify forklift condition.';
      case 'minor': return 'Minor bump or shock detected.';
      default: return 'Impact event recorded.';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="impact-alert-container">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`impact-alert impact-${alert.severity}`}
          style={{ borderColor: getSeverityColor(alert.severity) }}
        >
          <div className="alert-icon pulse">
            {getSeverityIcon(alert.severity)}
          </div>

          <div className="alert-content">
            <div className="alert-header">
              <h3>{getSeverityLabel(alert.severity)}</h3>
              <span className="alert-time">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>

            <div className="alert-body">
              <p className="alert-forklift">
                <strong>{alert.forkliftName}</strong> ({alert.forkliftId})
              </p>
              <p className="alert-message">{getSeverityMessage(alert.severity)}</p>

              <div className="alert-details">
                <span className="detail-item">
                  <span className="detail-label">Impact Force:</span>
                  <span className="detail-value">{alert.force}g</span>
                </span>

                {alert.location && (
                  <span className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">
                      {alert.location.latitude.toFixed(4)}°, {alert.location.longitude.toFixed(4)}°
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            className="alert-dismiss"
            onClick={() => dismissAlert(alert.id)}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ImpactAlert;
