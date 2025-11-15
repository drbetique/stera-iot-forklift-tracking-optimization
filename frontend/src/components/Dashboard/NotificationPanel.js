import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './NotificationPanel.css';
import { formatTime, formatPercentage } from '../../utils/formatters';

const NotificationPanel = ({ forklifts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (forklifts && forklifts.length > 0) {
      generateNotifications();
    }
  }, [forklifts]);

  const generateNotifications = () => {
    const newNotifications = [];

    forklifts.forEach(forklift => {
      const batteryLevel = forklift.batteryLevel || forklift.battery || 0;
      const activity = forklift.currentActivity || forklift.activity || 'UNKNOWN';
      const forkliftName = forklift.name || 'Unknown Forklift';

      // Critical battery alert
      if (batteryLevel < 20) {
        newNotifications.push({
          id: `battery-critical-${forklift._id || forklift.id}`,
          type: 'critical',
          title: 'Critical Battery Level',
          message: `${forkliftName} battery at ${formatPercentage(batteryLevel)}`,
          timestamp: new Date(),
          read: false
        });
      }
      // Low battery warning
      else if (batteryLevel >= 20 && batteryLevel <= 40) {
        newNotifications.push({
          id: `battery-low-${forklift._id || forklift.id}`,
          type: 'warning',
          title: 'Low Battery Warning',
          message: `${forkliftName} battery at ${formatPercentage(batteryLevel)}`,
          timestamp: new Date(),
          read: false
        });
      }

      // Idle too long
      if (activity === 'IDLE') {
        newNotifications.push({
          id: `idle-${forklift._id || forklift.id}`,
          type: 'warning',
          title: 'Forklift Idle',
          message: `${forkliftName} has been idle`,
          timestamp: new Date(),
          read: false
        });
      }

      // High productivity
      if (activity === 'WORKING' && batteryLevel > 60) {
        newNotifications.push({
          id: `productivity-${forklift._id || forklift.id}`,
          type: 'success',
          title: 'High Productivity',
          message: `${forkliftName} is performing well`,
          timestamp: new Date(),
          read: false
        });
      }
    });

    setNotifications(newNotifications);
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, [isOpen]);

  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const getNotificationClass = (type) => {
    return `notification-item notification-${type}`;
  };

  // Modal content to be rendered via Portal
  const modalContent = isOpen && (
    <div className="notification-modal-overlay" onClick={closePanel}>
      <div className="notification-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <h3>Notifications</h3>
          <div className="notification-modal-actions">
            {notifications.length > 0 && (
              <button className="clear-all-btn" onClick={clearAll}>
                Clear All
              </button>
            )}
            <button className="close-modal-btn" onClick={closePanel} aria-label="Close">
              &times;
            </button>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <span>No notifications</span>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={getNotificationClass(notification.type)}
                onClick={() => markAsRead(notification.id)}
                style={{ opacity: notification.read ? 0.6 : 1 }}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button className="notification-button" onClick={togglePanel}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Render modal using Portal to ensure it's on top */}
      {modalContent && ReactDOM.createPortal(
        modalContent,
        document.body
      )}
    </>
  );
};

export default NotificationPanel;
