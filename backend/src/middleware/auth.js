const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 * Validates token from Authorization header (Bearer token format)
 * Attaches user information to request object
 *
 * Usage:
 *   router.get('/protected', authenticateToken, (req, res) => {
 *     // req.user contains { id, username, email, role }
 *   });
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.'
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please login again.'
      });
    }

    // Generic error
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticateToken middleware
 *
 * @param {string|string[]} roles - Single role or array of allowed roles
 *
 * Usage:
 *   router.delete('/user/:id', authenticateToken, requireRole('admin'), deleteUser);
 *   router.post('/forklift', authenticateToken, requireRole(['admin', 'operator']), createForklift);
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Convert single role to array for uniform handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. This action requires elevated privileges.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is accessing their own resource or is admin
 * Useful for endpoints where users can only modify their own data
 *
 * @param {string} userIdParam - Name of the route parameter containing user ID
 *
 * Usage:
 *   router.put('/user/:userId', authenticateToken, requireSelfOrAdmin('userId'), updateUser);
 */
const requireSelfOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const requestedUserId = req.params[userIdParam];

    // Allow if user is admin or accessing their own resource
    if (req.user.role === 'admin' || req.user.id.toString() === requestedUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You can only access your own resources or must be an administrator.'
    });
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if valid token is provided, but doesn't reject if no token
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 *
 * Usage:
 *   router.get('/public-data', optionalAuth, getData);
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user info
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is active
    const user = await User.findById(decoded.id).select('-password');

    if (user && user.isActive) {
      // Attach user info to request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSelfOrAdmin,
  optionalAuth
};
