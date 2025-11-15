/**
 * Utility functions for formatting data in the Stera IoT Dashboard
 */

/**
 * Format a number with thousand separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number (e.g., "1,234")
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-US');
};

/**
 * Format a number with decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number (e.g., "1,234.56")
 */
export const formatDecimal = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} num - The number to format
 * @returns {string} Abbreviated number (e.g., "1.5K", "2.3M")
 */
export const formatAbbreviated = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  return num.toString();
};

/**
 * Format a percentage
 * @param {number} num - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted percentage (e.g., "75%")
 */
export const formatPercentage = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) return '0%';
  return num.toFixed(decimals) + '%';
};

/**
 * Format GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted coordinates (e.g., "40.7128, -74.0060")
 */
export const formatCoordinates = (lat, lng, decimals = 4) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return 'N/A';
  }
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
};

/**
 * Format a single coordinate
 * @param {number} coord - The coordinate value
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted coordinate
 */
export const formatCoordinate = (coord, decimals = 4) => {
  if (coord === null || coord === undefined || isNaN(coord)) return 'N/A';
  return coord.toFixed(decimals);
};

/**
 * Format distance in kilometers
 * @param {number} km - Distance in kilometers
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted distance (e.g., "12.5 km")
 */
export const formatDistance = (km, decimals = 1) => {
  if (km === null || km === undefined || isNaN(km)) return '0 km';
  return `${km.toFixed(decimals)} km`;
};

/**
 * Format speed in km/h
 * @param {number} speed - Speed in km/h
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted speed (e.g., "5.5 km/h")
 */
export const formatSpeed = (speed, decimals = 1) => {
  if (speed === null || speed === undefined || isNaN(speed)) return '0 km/h';
  return `${speed.toFixed(decimals)} km/h`;
};

/**
 * Format battery level
 * @param {number} level - Battery level (0-100)
 * @returns {string} Formatted battery level (e.g., "75%")
 */
export const formatBattery = (level) => {
  if (level === null || level === undefined || isNaN(level)) return '0%';
  return `${Math.round(level)}%`;
};

/**
 * Format time/duration in hours
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration (e.g., "4.5h", "0.5h")
 */
export const formatDuration = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) return '0h';

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }

  return `${hours.toFixed(1)}h`;
};

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date (e.g., "Jan 15, 2025")
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date and time to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time (e.g., "Jan 15, 2025 3:30 PM")
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @param {boolean} includeSeconds - Include seconds in output (default: false)
 * @returns {string} Formatted time (e.g., "3:30 PM" or "3:30:45 PM")
 */
export const formatTime = (date, includeSeconds = false) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Time';

  const options = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  if (includeSeconds) {
    options.second = '2-digit';
  }

  return dateObj.toLocaleTimeString('en-US', options);
};

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Time';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDate(dateObj);
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (typeof str !== 'string' || !str) return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format activity status with proper casing
 * @param {string} activity - Activity status
 * @returns {string} Formatted activity
 */
export const formatActivity = (activity) => {
  if (!activity) return 'Unknown';
  return activity.charAt(0).toUpperCase() + activity.slice(1).toLowerCase();
};

/**
 * Get battery status text based on level
 * @param {number} level - Battery level (0-100)
 * @returns {string} Status text (e.g., "Excellent", "Good", "Low", "Critical")
 */
export const getBatteryStatus = (level) => {
  if (level === null || level === undefined || isNaN(level)) return 'Unknown';

  if (level >= 80) return 'Excellent';
  if (level >= 60) return 'Good';
  if (level >= 40) return 'Fair';
  if (level >= 20) return 'Low';
  return 'Critical';
};

/**
 * Get battery icon based on level
 * @param {number} level - Battery level (0-100)
 * @returns {string} Battery emoji
 */
export const getBatteryIcon = (level) => {
  if (level === null || level === undefined || isNaN(level)) return '❓';

  if (level >= 80) return '🔋';
  if (level >= 60) return '🔋';
  if (level >= 40) return '🔋';
  if (level >= 20) return '🪫';
  return '⚠️';
};

/**
 * Get activity icon
 * @param {string} activity - Activity status
 * @returns {string} Activity emoji
 */
export const getActivityIcon = (activity) => {
  const icons = {
    'DRIVING': '🚗',
    'WORKING': '⚙️',
    'IDLE': '⏸️',
    'PARKED': '🅿️',
    'CHARGING': '🔋',
    'UNKNOWN': '❓'
  };
  return icons[activity?.toUpperCase()] || icons.UNKNOWN;
};

/**
 * Get activity color
 * @param {string} activity - Activity status
 * @returns {string} Color hex code
 */
export const getActivityColor = (activity) => {
  const colors = {
    'DRIVING': '#3b82f6',
    'WORKING': '#10b981',
    'IDLE': '#f59e0b',
    'PARKED': '#6b7280',
    'CHARGING': '#8b5cf6',
    'UNKNOWN': '#9ca3af'
  };
  return colors[activity?.toUpperCase()] || colors.UNKNOWN;
};

/**
 * Get battery color based on level
 * @param {number} level - Battery level (0-100)
 * @returns {string} Color hex code
 */
export const getBatteryColor = (level) => {
  if (level === null || level === undefined || isNaN(level)) return '#9ca3af';

  if (level >= 70) return '#10b981'; // Green
  if (level >= 40) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
};

/**
 * Safely get nested object property
 * @param {object} obj - Object to traverse
 * @param {string} path - Dot-notation path (e.g., "user.name.first")
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Value at path or default value
 */
export const getNestedProperty = (obj, path, defaultValue = 'N/A') => {
  if (!obj || !path) return defaultValue;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== null && result !== undefined ? result : defaultValue;
};
