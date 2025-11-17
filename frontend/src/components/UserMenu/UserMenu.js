import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './UserMenu.css';

/**
 * UserMenu component
 * Displays user information and logout button in the dashboard header
 */
const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleManageUsers = () => {
    setIsOpen(false);
    navigate('/users');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#dc2626'; // red
      case 'operator':
        return '#2563eb'; // blue
      case 'viewer':
        return '#059669'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-button"
        onClick={toggleMenu}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          {getInitials(user?.fullName || user?.username)}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.fullName || user?.username}</span>
          <span
            className="user-role"
            style={{ color: getRoleBadgeColor(user?.role) }}
          >
            {user?.role}
          </span>
        </div>
        <svg
          className={`chevron-icon ${isOpen ? 'open' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-avatar-large">
              {getInitials(user?.fullName || user?.username)}
            </div>
            <div className="user-details">
              <p className="user-details-name">{user?.fullName}</p>
              <p className="user-details-email">{user?.email}</p>
              <span
                className="user-details-role"
                style={{
                  backgroundColor: getRoleBadgeColor(user?.role),
                  color: 'white'
                }}
              >
                {user?.role}
              </span>
            </div>
          </div>

          <div className="user-menu-divider"></div>

          <div className="user-menu-items">
            {/* Admin-only: Manage Users */}
            {user?.role === 'admin' && (
              <button
                className="user-menu-item"
                onClick={handleManageUsers}
              >
                <svg className="menu-item-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Manage Users</span>
              </button>
            )}

            <button
              className="user-menu-item logout-button"
              onClick={handleLogout}
            >
              <svg className="menu-item-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
