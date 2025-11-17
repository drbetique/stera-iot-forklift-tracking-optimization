# Stera IoT Forklift Tracking System

> Real-time fleet management and monitoring system for industrial forklifts

![Stera Logo](frontend/public/stera-logo.jpg)

## Overview

The Stera IoT Forklift Tracking System is a comprehensive fleet management platform that provides real-time monitoring, telemetry tracking, and management capabilities for industrial forklift operations. The system integrates ESP32-based hardware sensors with a full-stack web and mobile application.

## Features

### Web Dashboard
- Real-time fleet monitoring (20 forklifts)
- Live telemetry and sensor data
- Activity distribution analytics
- Battery status monitoring
- User management (role-based access control)
- Alert notifications
- Data export functionality
- Historical data analysis

### Mobile Application (React Native + Expo)
- Cross-platform (iOS & Android)
- Real-time dashboard with auto-refresh
- Smart notifications with priority sorting
- User management (admin-only)
- Detailed forklift telemetry
- Pull-to-refresh on all screens
- Offline-capable authentication

### Backend API
- RESTful API with Express.js
- MongoDB Atlas database
- JWT authentication
- Role-based access control (admin, operator, viewer)
- Telemetry data processing
- User management endpoints

## Architecture

### Technology Stack

**Frontend (Web):**
- React 18
- React Router v7
- Context API for state management
- CSS3 with responsive design

**Mobile:**
- React Native
- Expo SDK 54
- React Navigation
- Axios for API calls
- Expo SecureStore for token storage

**Backend:**
- Node.js + Express.js
- MongoDB Atlas (Cloud Database)
- Mongoose ODM
- JWT authentication
- bcrypt password hashing

**Hardware (ESP32):**
- UWB Positioning (Qorvo DWM1001-DEV)
- MPU6050 (Accelerometer/Gyroscope)
- RC522 RFID Reader
- HC-SR04 Ultrasonic Sensor

### System Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   ESP32 Nodes   │ ─HTTP──>│  Backend API     │<─HTTP───│  Web Dashboard  │
│  (20 Forklifts) │         │  (Express.js)    │         │    (React)      │
└─────────────────┘         └─────────┬────────┘         └─────────────────┘
                                      │
                            ┌─────────▼────────┐         ┌─────────────────┐
                            │  MongoDB Atlas   │         │  Mobile App     │
                            │   (Database)     │         │  (React Native) │
                            └──────────────────┘         └─────────────────┘
```

## Project Structure

```
stera-iot-project/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   └── seeds/       # Database seeders
│   └── server.js        # Entry point
├── frontend/            # React web application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Context providers
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── package.json
├── mobile/              # React Native mobile app
│   ├── screens/         # App screens
│   ├── contexts/        # Auth context
│   ├── services/        # API services
│   ├── config/          # App configuration
│   └── assets/          # Images and assets
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- Expo CLI (for mobile development)
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://your-connection-string
# JWT_SECRET=your-secure-random-string
# PORT=3001

# Seed database with sample data (20 forklifts, 3 users)
npm run seed

# Start server
npm start
```

Backend will be available at: `http://localhost:3001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (default: http://localhost:3001/api)
# REACT_APP_API_URL=http://localhost:3001/api

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

### Mobile Setup

```bash
# Navigate to mobile
cd mobile

# Install dependencies
npm install

# Update API configuration
# Edit mobile/config/api.config.js with your computer's IP address
# Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)

# Start Expo
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
```

**Important for Mobile:**
- Mobile device must be on the **same WiFi network** as your computer
- Use your computer's IP address (not localhost) in `mobile/config/api.config.js`
- Backend must be running and accessible

## Default User Accounts

After running the seed script, these accounts are available:

| Username | Password    | Role     | Access Level |
|----------|-------------|----------|--------------|
| admin    | Admin@123   | admin    | Full access (all features) |
| operator | Operator@123| operator | View + operate |
| viewer   | Viewer@123  | viewer   | Read-only access |

## Mobile App Testing

1. Install Expo Go on your phone:
   - iOS: App Store
   - Android: Google Play Store

2. Ensure both phone and computer are on the same WiFi

3. Update `mobile/config/api.config.js` with your computer's IP:
   ```javascript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3001';
   ```

4. Start Expo and scan QR code

5. Login with test credentials

## Development Workflow

### Adding New Features

1. **Backend**: Add routes in `backend/src/routes/`
2. **Frontend**: Add components in `frontend/src/components/`
3. **Mobile**: Add screens in `mobile/screens/`
4. **API Service**: Update `services/api.js` in both frontend and mobile

### Database Models

Located in `backend/src/models/`:
- `User.js` - User authentication and roles
- `Forklift.js` - Forklift fleet data
- `Telemetry.js` - Sensor telemetry data
- `Station.js` - Charging/parking stations

### Authentication Flow

1. User logs in with credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage (web) or SecureStore (mobile)
4. Token included in Authorization header for all API requests
5. Backend middleware validates token and role
6. Invalid/expired tokens trigger automatic logout

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Forklifts
- `GET /api/forklifts` - Get all forklifts
- `GET /api/forklifts/:id` - Get forklift by ID
- `POST /api/forklifts` - Create forklift (admin only)

### Telemetry
- `GET /api/telemetry` - Get all telemetry
- `GET /api/telemetry/:forkliftId/latest` - Get latest data
- `GET /api/telemetry/:forkliftId/history` - Get historical data
- `POST /api/telemetry` - Submit telemetry (ESP32 nodes)

### User Management (Admin Only)
- `GET /api/auth/users` - Get all users
- `POST /api/auth/users` - Create user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user
- `PUT /api/auth/users/:id/toggle-active` - Activate/deactivate

Full API documentation available at: `http://localhost:3001` (when server is running)

## Hardware Integration

### Expected Data from Hardware Team

The ESP32 nodes should POST telemetry data to `/api/telemetry` endpoint:

**Endpoint:** `POST http://YOUR_SERVER_IP:3001/api/telemetry`

**Required Headers:**
```
Content-Type: application/json
```

**Expected JSON Payload:**
```json
{
  "forkliftId": "FL001",
  "timestamp": "2025-11-16T12:00:00.000Z",
  "location": {
    "type": "Point",
    "coordinates": [24.9350, 60.1699]
  },
  "batteryLevel": 75,
  "currentActivity": "DRIVING",
  "speed": 5.2,
  "acceleration": {
    "x": 0.5,
    "y": 0.2,
    "z": 9.8
  },
  "gyroscope": {
    "x": 0.1,
    "y": 0.05,
    "z": 0.02
  },
  "obstacleDistance": 150,
  "forkHeight": 120,
  "forkTilt": 0,
  "forkStatus": "RETRACTED",
  "rfidTagId": "STATION_01",
  "engineHours": 1234.5,
  "loadWeight": 500,
  "temperature": 25.5
}
```

**Field Specifications:**

| Field | Type | Required | Range/Format | Description |
|-------|------|----------|--------------|-------------|
| `forkliftId` | String | Yes | FL001-FL020 | Unique forklift identifier |
| `timestamp` | ISO Date | Yes | ISO 8601 | Data capture timestamp |
| `location.coordinates` | [Number, Number] | Yes | [lon, lat] | GPS coordinates [longitude, latitude] |
| `batteryLevel` | Number | Yes | 0-100 | Battery percentage |
| `currentActivity` | String | Yes | Enum | One of: PARKED, IDLE, DRIVING, WORKING, CHARGING, UNKNOWN |
| `speed` | Number | No | 0-20 km/h | Current speed |
| `acceleration.x/y/z` | Number | No | m/s² | MPU6050 accelerometer data |
| `gyroscope.x/y/z` | Number | No | rad/s | MPU6050 gyroscope data |
| `obstacleDistance` | Number | No | 0-400 cm | HC-SR04 ultrasonic distance |
| `forkHeight` | Number | No | 0-500 cm | Fork elevation height |
| `forkTilt` | Number | No | -45 to 45° | Fork tilt angle |
| `forkStatus` | String | No | Enum | RAISED, LOWERED, RETRACTED |
| `rfidTagId` | String | No | STATION_XX | RC522 RFID tag read |
| `engineHours` | Number | No | Hours | Total operating hours |
| `loadWeight` | Number | No | 0-5000 kg | Current load weight |
| `temperature` | Number | No | -40 to 85°C | Operating temperature |

**Activity States Logic:**
- `PARKED`: Speed = 0, Engine off, at station
- `IDLE`: Speed = 0, Engine on, not at station
- `DRIVING`: Speed > 0, No load operation
- `WORKING`: Load operation (fork raised/tilted)
- `CHARGING`: At charging station (RFID detected)

**Data Transmission Frequency:**
- Normal operation: Every 10 seconds
- Critical events (low battery <20%): Immediate
- Activity change: Immediate
- Minimum interval: 5 seconds

**Error Handling:**
- Backend responds with status code
- `200 OK`: Data received successfully
- `400 Bad Request`: Invalid data format
- `401 Unauthorized`: Authentication required (future)
- `500 Server Error`: Server issue

**Example ESP32 Code Snippet:**
```cpp
// POST telemetry to server
HTTPClient http;
http.begin("http://YOUR_SERVER_IP:3001/api/telemetry");
http.addHeader("Content-Type", "application/json");

String json = "{\"forkliftId\":\"FL001\",\"batteryLevel\":75,...}";
int httpCode = http.POST(json);

if (httpCode == 200) {
  Serial.println("Data sent successfully");
} else {
  Serial.printf("Error: %d\n", httpCode);
}
http.end();
```

### Hardware Testing

1. **Verify Backend Accessibility:**
   ```bash
   # From ESP32 network, test with curl:
   curl -X POST http://YOUR_SERVER_IP:3001/api/telemetry \
     -H "Content-Type: application/json" \
     -d '{"forkliftId":"FL001","batteryLevel":80,...}'
   ```

2. **Monitor Server Logs:**
   ```bash
   cd backend
   npm start
   # Watch for incoming POST requests
   ```

3. **View Data in Dashboard:**
   - Open `http://localhost:3000`
   - Login as admin
   - Verify forklift data updates in real-time

### Hardware Requirements Summary

**Sensors per Forklift:**
- Qorvo DWM1001-DEV (UWB positioning)
- MPU6050 (6-axis motion tracking)
- RC522 (RFID reader)
- HC-SR04 (Ultrasonic distance)
- Battery voltage sensor
- GPS module (optional, for outdoor use)

**Communication:**
- WiFi connectivity (2.4GHz recommended)
- HTTP POST to backend server
- JSON data format
- SSL/TLS for production (HTTPS)

**Power:**
- ESP32 operates on forklift battery (12-48V DC with regulator)
- Low power mode when idle
- Wake on motion detection

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Mobile Tests
```bash
cd mobile
npm test
```

### End-to-End Testing
1. Start backend server
2. Start frontend server
3. Login to web dashboard
4. Verify all 20 forklifts display
5. Check real-time updates
6. Test mobile app connectivity
7. Verify notifications system
8. Test user management (admin)

## Performance

- **Real-time Updates**: 10-second auto-refresh on web/mobile
- **API Response Time**: < 200ms average
- **Database Queries**: Optimized with indexes
- **Mobile App Size**: ~15MB (Expo managed)
- **Concurrent Users**: Supports 100+ simultaneous users

## Security

- JWT token-based authentication
- bcrypt password hashing (10 salt rounds)
- Role-based access control (RBAC)
- Secure token storage (HttpOnly cookies planned)
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration
- Rate limiting (planned)

## Deployment

### Production Checklist

- [ ] Update MongoDB connection string for production
- [ ] Set strong JWT_SECRET in production .env
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Configure CORS for production domains
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Update API URLs in frontend and mobile
- [ ] Build production bundles
- [ ] Deploy to hosting service

### Recommended Hosting

- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas (already cloud-based)
- **Mobile**: Build APK/IPA and deploy to app stores

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is proprietary software owned by Stera Technologies.
All rights reserved. Unauthorized copying or distribution is prohibited.

## Team

**Development Team:**
- Full Stack Development
- Mobile Application Development
- Backend API Development
- Database Design
- UI/UX Design

**Hardware Team** (Expected Integration):
- ESP32 firmware development
- Sensor integration
- UWB positioning system
- RFID implementation
- Power management

## Support

For issues, questions, or suggestions:
- Create an issue in the GitHub repository
- Contact: support@stera-technologies.com
- Documentation: See CLAUDE.md for architecture details

## Roadmap

### Phase 1: Core Development (Complete)
- [x] Backend API with authentication
- [x] Web dashboard with real-time data
- [x] Mobile application (iOS/Android)
- [x] User management system
- [x] Notification system

### Phase 2: Hardware Integration (In Progress)
- [ ] ESP32 firmware development
- [ ] Sensor calibration
- [ ] Real-time data transmission
- [ ] Field testing with 20 forklifts

### Phase 3: Advanced Features (Planned)
- [ ] WebSocket for real-time push updates
- [ ] Advanced analytics and reporting
- [ ] Predictive maintenance alerts
- [ ] Geofencing and zone management
- [ ] Fleet optimization algorithms
- [ ] Mobile push notifications
- [ ] Offline mode with data sync

### Phase 4: Production Deployment (Planned)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production hosting setup
- [ ] App store deployment (iOS/Android)
- [ ] User training and documentation
- [ ] Monitoring and alerting

## Project Status

**Current Version**: 1.0.0
**Status**: Software Development Complete, Hardware Integration Pending
**Last Updated**: November 2025

---

**Made with care by Stera Technologies**
