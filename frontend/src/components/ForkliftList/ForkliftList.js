import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ForkliftList.css';
import ForkliftDetailsModal from './ForkliftDetailsModal';
import {
  formatTime,
  formatCoordinate,
  formatPercentage,
  formatNumber,
  capitalize,
  getBatteryIcon,
  getActivityIcon,
  getActivityColor,
  getBatteryColor
} from '../../utils/formatters';

// Skeleton Card for Loading State
const SkeletonForkliftCard = () => (
  <div className="forklift-card skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-badge"></div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
  </div>
);

function ForkliftList() {
  const [forklifts, setForklifts] = useState([]);
  const [filteredForklifts, setFilteredForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivity, setFilterActivity] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [selectedForklift, setSelectedForklift] = useState(null);

  const fetchForklifts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      const data = await api.getForklifts();
      setForklifts(data);
      setError(null);

      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    } catch (err) {
      setError('Failed to fetch forklifts');
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setRefreshing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (forklift) => {
    setSelectedForklift(forklift);
  };

  const closeDetailsModal = () => {
    setSelectedForklift(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedForklift) {
        closeDetailsModal();
      }
    };

    if (selectedForklift) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedForklift]);

  useEffect(() => {
    fetchForklifts();
    // Refresh every 10 seconds
    const interval = setInterval(fetchForklifts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filterAndSortForklifts = () => {
      let filtered = [...forklifts];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(f =>
          (f.name && f.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (f.forkliftId && f.forkliftId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (f.model && f.model.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Apply activity filter
      if (filterActivity !== 'ALL') {
        filtered = filtered.filter(f => f.currentActivity === filterActivity);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'battery':
            return (b.batteryLevel || 0) - (a.batteryLevel || 0);
          case 'activity':
            return (a.currentActivity || '').localeCompare(b.currentActivity || '');
          default:
            return 0;
        }
      });

      setFilteredForklifts(filtered);
    };

    filterAndSortForklifts();
  }, [forklifts, searchTerm, filterActivity, sortBy]);


  if (loading) {
    return (
      <div className="forklift-list">
        <div className="list-header">
          <div className="header-title">
            <h1>Fleet Overview</h1>
          </div>
        </div>
        <div className="forklift-grid">
          <SkeletonForkliftCard />
          <SkeletonForkliftCard />
          <SkeletonForkliftCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forklift-list">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button
            className="retry-btn"
            onClick={() => { setLoading(true); fetchForklifts(true); }}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Retrying...' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
    <div className="forklift-list">
      {/* Enhanced List Header */}
      <div className="list-header">
        <div className="header-title">
          <h2>Fleet Overview</h2>
          <span className="fleet-count">{formatNumber(filteredForklifts.length)} / {formatNumber(forklifts.length)} units</span>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchForklifts(true)}
          disabled={refreshing}
          aria-label="Refresh forklift list"
        >
          <span className={`btn-icon ${refreshing ? 'spinning' : ''}`}>🔄</span>
          <span className="btn-text">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-panel">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Activities</option>
            <option value="DRIVING">🚗 Driving</option>
            <option value="WORKING">⚙️ Working</option>
            <option value="IDLE">⏸️ Idle</option>
            <option value="PARKED">🅿️ Parked</option>
            <option value="CHARGING">🔋 Charging</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort: Name</option>
            <option value="battery">Sort: Battery</option>
            <option value="activity">Sort: Activity</option>
          </select>
        </div>
      </div>

      {/* Forklift Grid */}
      {filteredForklifts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No forklifts found</h3>
          <p className="empty-hint">
            {searchTerm || filterActivity !== 'ALL'
              ? 'Try adjusting your search or filter'
              : 'Waiting for forklift data...'}
          </p>
          {(searchTerm || filterActivity !== 'ALL') && (
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setFilterActivity('ALL');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="forklift-grid">
          {filteredForklifts.map((forklift, index) => (
            <div
              key={forklift._id || index}
              className="forklift-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-header">
                <div className="forklift-id">
                  <span className="forklift-icon">🚜</span>
                  <div>
                    <h3 className="forklift-name">{forklift.name || 'Unnamed'}</h3>
                    <p className="id-text">{forklift.forkliftId || 'No ID'}</p>
                  </div>
                </div>
                <div
                  className="activity-badge"
                  style={{ backgroundColor: getActivityColor(forklift.currentActivity) }}
                >
                  {getActivityIcon(forklift.currentActivity)} {forklift.currentActivity || 'UNKNOWN'}
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Model</span>
                  <span className="value">{forklift.model || 'N/A'}</span>
                </div>

                <div className="info-row">
                  <span className="label">Status</span>
                  <span className={`status-badge ${forklift.status ? forklift.status.toLowerCase() : 'unknown'}`}>
                    <span className="status-dot"></span>
                    {capitalize(forklift.status)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="label">Battery</span>
                  <div className="battery-container">
                    <div className="battery-bar">
                      <div
                        className="battery-fill"
                        style={{
                          width: `${forklift.batteryLevel || 0}%`,
                          backgroundColor: getBatteryColor(forklift.batteryLevel || 0)
                        }}
                      >
                        <span className="battery-percentage">{formatPercentage(forklift.batteryLevel || 0)}</span>
                      </div>
                    </div>
                    <span className="battery-icon">{getBatteryIcon(forklift.batteryLevel || 0)}</span>
                  </div>
                </div>

                {forklift.currentLocation && (
                  <div className="info-row">
                    <span className="label">Location</span>
                    <span className="value location">
                      📍 {formatCoordinate(forklift.currentLocation.latitude)}, {formatCoordinate(forklift.currentLocation.longitude)}
                    </span>
                  </div>
                )}

                <div className="info-row">
                  <span className="label">Last Update</span>
                  <span className="value time">
                    {formatTime(forklift.lastSeen, true)}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="detail-btn"
                  onClick={() => handleViewDetails(forklift)}
                  aria-label={`View details for ${forklift.name || 'forklift'}`}
                >
                  <span>View Details</span>
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Render comprehensive details modal */}
    {selectedForklift && (
      <ForkliftDetailsModal
        forklift={selectedForklift}
        onClose={closeDetailsModal}
      />
    )}
    </>
  );
}


export default ForkliftList;
