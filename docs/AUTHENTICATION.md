# Stera IoT Forklift Tracking - Authentication System

## Overview

This document describes the comprehensive authentication and access control system implemented for the Stera IoT Forklift Tracking application. The system provides secure user authentication across both web and mobile platforms using JWT (JSON Web Tokens).

## Table of Contents

- [Architecture](#architecture)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Backend Implementation](#backend-implementation)
- [Web Application](#web-application)
- [Mobile Application](#mobile-application)
- [Security Features](#security-features)
- [Default User Accounts](#default-user-accounts)
- [API Endpoints](#api-endpoints)
- [Testing Guide](#testing-guide)

---

## Architecture

### Authentication Flow

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │ 1. Login Request (username, password)
       ├────────────────────────────────────────┐
       │                                        │
┌──────▼────────┐                       ┌──────▼────────┐
│   Backend     │                       │   Database    │
│   API Server  │                       │   MongoDB     │
└──────┬────────┘                       └───────────────┘
       │ 2. Validate credentials
       │ 3. Generate JWT Token
       ├────────────────────────────────────────┐
       │                                        │
┌──────▼──────┐                                │
│   Client    │                                │
│ Stores Token│                                │
└──────┬──────┘                                │
       │ 4. Subsequent requests with token     │
       ├────────────────────────────────────────┘
       │ 5. Validate token
       │ 6. Return protected data
```

### Technology Stack

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- bcrypt for password hashing
- jsonwebtoken for JWT generation/validation

**Web Frontend:**
- React 18
- React Router DOM for routing
- localStorage for token storage
- Context API for auth state management

**Mobile App:**
- React Native + Expo
- React Navigation for navigation
- expo-secure-store for secure token storage
- Context API for auth state management

---

## User Roles and Permissions

### Admin
- **Full Access**: All permissions
- Can create, read, update, and delete all resources
- Can manage users (create, deactivate, change roles)
- Can view all analytics and reports

### Operator
- **Read/Write Access**: Most resources
- Can view and edit forklifts and stations
- Can view all analytics and reports
- Cannot manage users or delete resources

### Viewer
- **Read-Only Access**: All resources
- Can view dashboard, forklifts, stations, and analytics
- Cannot create, edit, or delete any resources
- Cannot manage users

---

## Backend Implementation

### User Model

**Location**: `backend/src/models/User.js`

**Schema Fields:**
```javascript
{
  username: String (unique, required, 3-30 chars)
  email: String (unique, required, valid email)
  password: String (hashed, required, min 8 chars)
  role: Enum ['admin', 'operator', 'viewer'] (default: viewer)
  fullName: String (required)
  isActive: Boolean (default: true)
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
```

**Security Features:**
- Passwords are hashed using bcrypt with 10 salt rounds
- Password field is excluded from queries by default (`select: false`)
- Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
- Pre-save middleware automatically hashes passwords

### Authentication Middleware

**Location**: `backend/src/middleware/auth.js`

**Functions:**

1. **authenticateToken**: Validates JWT token from Authorization header
2. **requireRole**: Checks if user has required role(s)
3. **requireSelfOrAdmin**: Allows access to own resources or admin
4. **optionalAuth**: Attaches user info if token present, but doesn't reject

**Usage Example:**
```javascript
// Protect all routes in a router
router.use(authenticateToken);

// Require specific role
router.post('/forklifts', authenticateToken, requireRole(['admin', 'operator']), createForklift);

// Allow user to access own resource or admin
router.put('/user/:userId', authenticateToken, requireSelfOrAdmin('userId'), updateUser);
```

### Protected Routes

All API routes are protected with authentication:

- `/api/forklifts/*` - Requires authentication, POST/PUT require admin/operator role
- `/api/stations/*` - Requires authentication, POST/PUT require admin/operator role
- `/api/telemetry/*` - GET requires authentication, POST is open for ESP32 devices
- `/api/auth/register` - Requires admin role
- `/api/auth/users/*` - Requires admin role

### Environment Variables

**Required in `.env`:**
```env
JWT_SECRET=your-very-secure-random-secret-key-change-in-production
JWT_EXPIRES_IN=24h
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

---

## Web Application

### AuthContext

**Location**: `frontend/src/contexts/AuthContext.js`

**Provides:**
- `user`: Current user object
- `token`: JWT token
- `loading`: Loading state
- `error`: Error messages
- `login(username, password)`: Login function
- `logout()`: Logout function
- `isAuthenticated`: Boolean for auth state

**Usage:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, login, logout, isAuthenticated } = useAuth();
  // Use auth state and functions
}
```

### Login Page

**Location**: `frontend/src/components/Login/Login.js`

**Features:**
- Professional design with Stera branding
- Username/email input
- Password input with show/hide toggle
- Remember me checkbox
- Error message display
- Loading state during login
- Demo credentials helper

### Protected Routes

**Location**: `frontend/src/components/ProtectedRoute.js`

**Features:**
- Redirects unauthenticated users to login
- Saves attempted route for post-login redirect
- Loading state while checking authentication
- Role-based access control (optional)

**Usage:**
```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin', 'operator']}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### User Menu

**Location**: `frontend/src/components/UserMenu/UserMenu.js`

**Features:**
- Displays user avatar with initials
- Shows user name and role
- Dropdown menu with user details
- Logout button
- Role-based badge color

---

## Mobile Application

### AuthContext

**Location**: `mobile/contexts/AuthContext.js`

**Similar to web, but uses SecureStore for token storage**

**Key Differences:**
- Uses `expo-secure-store` instead of localStorage
- Async token operations (saveToken, getToken, removeToken)

### LoginScreen

**Location**: `mobile/screens/LoginScreen.js`

**Features:**
- Mobile-optimized design
- Keyboard-avoiding view
- Touch-friendly inputs
- Show/hide password toggle
- Demo credentials button
- Loading indicator
- Alert dialogs for errors

### Navigation Flow

**Location**: `mobile/App.js`

**Structure:**
```
AuthProvider
  └─ RootNavigator
      ├─ AuthNavigator (if not authenticated)
      │   └─ LoginScreen
      │
      └─ AppNavigator (if authenticated)
          └─ Tab Navigator
              └─ HomeStack
                  ├─ HomeScreen
                  └─ DetailsScreen
```

---

## Security Features

### Password Security

1. **Hashing**: bcrypt with 10 salt rounds
2. **Strength Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

### Token Security

1. **JWT Configuration**:
   - Expiration: 24 hours (configurable)
   - Signed with secret key
   - Contains user ID, username, email, role

2. **Token Validation**:
   - Verified on every protected request
   - User existence check
   - Active account check
   - Expiration check

3. **Token Storage**:
   - Web: localStorage (acceptable for demo, use httpOnly cookies in production)
   - Mobile: SecureStore (encrypted storage)

### API Security

1. **CORS**: Configured to allow frontend origins
2. **Helmet**: Security headers middleware
3. **Input Validation**: Mongoose schema validation
4. **Error Handling**: Generic error messages to prevent information leakage
5. **Rate Limiting**: Consider implementing for production

---

## Default User Accounts

### Seeding Users

**Command**: `npm run seed:users` (in backend directory)

**Script Location**: `backend/src/seeds/seedUsers.js`

### Default Accounts

| Username | Email | Password | Role | Permissions |
|----------|-------|----------|------|-------------|
| admin | admin@stera.com | Admin@123 | admin | Full access |
| operator | operator@stera.com | Operator@123 | operator | Read/Write (no user management) |
| viewer | viewer@stera.com | Viewer@123 | viewer | Read-only |

**IMPORTANT**: Change these passwords in production!

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
**Description**: Authenticate user and return JWT token
**Access**: Public
**Request Body**:
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@stera.com",
    "role": "admin",
    "fullName": "System Administrator"
  }
}
```

#### POST /api/auth/register
**Description**: Register new user (Admin only)
**Access**: Private (Admin)
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "username": "newuser",
  "email": "newuser@stera.com",
  "password": "SecurePass@123",
  "role": "viewer",
  "fullName": "New User"
}
```

#### GET /api/auth/me
**Description**: Get current user information
**Access**: Private
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin",
    "email": "admin@stera.com",
    "role": "admin",
    "fullName": "System Administrator",
    "isActive": true,
    "lastLogin": "2025-01-16T10:30:00.000Z"
  }
}
```

#### POST /api/auth/logout
**Description**: Logout user (client-side token removal)
**Access**: Private
**Headers**: `Authorization: Bearer <token>`

#### PUT /api/auth/change-password
**Description**: Change user password
**Access**: Private
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "oldPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

#### GET /api/auth/users
**Description**: Get all users (Admin only)
**Access**: Private (Admin)
**Headers**: `Authorization: Bearer <token>`

#### PUT /api/auth/users/:userId/toggle-active
**Description**: Activate/deactivate user account (Admin only)
**Access**: Private (Admin)
**Headers**: `Authorization: Bearer <token>`

---

## Testing Guide

### Backend Testing

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Seed Users**:
   ```bash
   npm run seed:users
   ```

3. **Test Login with cURL**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"Admin@123"}'
   ```

4. **Test Protected Endpoint**:
   ```bash
   # Use token from login response
   curl http://localhost:3001/api/forklifts \
     -H "Authorization: Bearer <your_token_here>"
   ```

### Web Application Testing

1. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

2. **Test Login**:
   - Navigate to http://localhost:3000
   - Should redirect to /login
   - Enter credentials: admin / Admin@123
   - Should redirect to dashboard

3. **Test Protected Routes**:
   - Try accessing / without login → should redirect to /login
   - After login, should access dashboard normally

4. **Test Logout**:
   - Click user menu in top-right
   - Click Logout
   - Should return to login page

### Mobile Application Testing

1. **Update API URL**:
   - Edit `mobile/services/api.js`
   - Change `API_BASE_URL` to your local IP address
   - Find IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

2. **Start Mobile App**:
   ```bash
   cd mobile
   npx expo start
   ```

3. **Test Login**:
   - Scan QR code with Expo Go app
   - Should show login screen
   - Enter credentials
   - Should navigate to fleet screen

4. **Test Session Persistence**:
   - Close and reopen app
   - Should remain logged in

---

## Production Considerations

### Security Enhancements

1. **Environment Variables**:
   - Generate strong JWT_SECRET (32+ random characters)
   - Use different secrets for dev/staging/production

2. **Token Storage**:
   - Web: Use httpOnly cookies instead of localStorage
   - Consider implementing refresh tokens

3. **Password Policy**:
   - Enforce password expiration
   - Implement password history
   - Add account lockout after failed attempts

4. **Rate Limiting**:
   - Implement rate limiting on login endpoint
   - Add CAPTCHA for repeated failed attempts

5. **HTTPS**:
   - Always use HTTPS in production
   - Set secure flags on cookies

6. **Token Blacklisting**:
   - Implement token blacklist for logout
   - Use Redis for fast blacklist lookups

### Monitoring

1. **Logging**:
   - Log authentication attempts
   - Log authorization failures
   - Track suspicious activity

2. **Audit Trail**:
   - Record user actions
   - Track data modifications
   - Maintain user activity logs

---

## Troubleshooting

### Common Issues

#### Login Fails with "Network Error"
- **Cause**: Backend not running or wrong URL
- **Solution**: Ensure backend is running on correct port, check CORS settings

#### Token Expired Error
- **Cause**: Token expiration time reached
- **Solution**: Login again, implement refresh token mechanism

#### Mobile App Can't Connect
- **Cause**: Wrong API URL or network firewall
- **Solution**: Use local IP address, ensure devices on same network

#### Password Validation Fails
- **Cause**: Password doesn't meet requirements
- **Solution**: Use password with uppercase, lowercase, number, special char

---

## Support

For questions or issues:
1. Check this documentation
2. Review error messages in browser/app console
3. Check backend server logs
4. Verify environment variables are set correctly

---

**Last Updated**: January 16, 2025
**Version**: 1.0.0
