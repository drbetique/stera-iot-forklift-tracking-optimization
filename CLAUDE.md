# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time IoT forklift tracking system using ESP32 microcontrollers, UWB positioning, and cloud-based analytics. The system tracks forklift location, activity state, battery levels, collision detection, and RFID station identification.

## Architecture

This is a **monorepo** containing three main applications:

### Backend (Node.js + Express + MongoDB)
- RESTful API server on port 3001
- MongoDB Atlas for persistent storage
- Mongoose ODM for data modeling
- All routes return `{ success: boolean, data/message: any }` format

**Key Models:**
- `Telemetry`: Time-series sensor data (GPS, accelerometer, ultrasonic, RFID, activity state)
- `Forklift`: Fleet registry with current status and location
- `Station`: RFID checkpoint locations

**API Endpoints:**
- `POST /api/telemetry` - Receive sensor data from ESP32
- `GET /api/telemetry/:forkliftId/latest` - Latest reading
- `GET /api/telemetry/:forkliftId/history` - Historical data with date range
- `GET /api/forklifts` - All forklifts
- `GET /api/forklifts/:forkliftId` - Single forklift
- `POST /api/forklifts` - Register new forklift
- `GET /api/stations` - All stations

### Frontend (React 18)
- Web dashboard on port 3000
- Component-based architecture with auto-refresh (10s interval)
- Leaflet.js for real-time map visualization
- Chart.js for analytics
- API calls via `src/services/api.js` with cache-busting

**Key Components:**
- `Dashboard`: Main container with auto-refresh logic
- `ForkliftList`: Fleet overview with status cards
- `MapView`: Leaflet map showing GPS positions
- `FleetMetrics`, `ActivityChart`, `BatteryTrends`: Analytics
- `HistoricalCharts`, `ExportPanel`, `NotificationPanel`: Advanced features

### Mobile (React Native + Expo)
- Cross-platform iOS/Android app
- React Navigation with bottom tabs and stack navigation
- Screens: `HomeScreen` (fleet list), `DetailsScreen` (individual forklift)
- API service in `services/api.js` must be configured with computer IP for phone testing

## Development Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start with nodemon (auto-reload)
npm start               # Production mode
npm run seed            # Seed sample data (3 forklifts, 5 stations, 30 telemetry records)
```

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm start               # Start dev server (opens browser at localhost:3000)
npm run build           # Production build
npm test                # Run tests
```

### Mobile
```bash
cd mobile
npm install              # Install dependencies
npx expo start          # Start Expo dev server
npx expo start --web    # Web preview
npx expo start --android # Android emulator
npx expo start --ios    # iOS simulator
```
Press `w` in Expo CLI for web preview, scan QR with Expo Go app for phone testing.

## Environment Setup

### Backend `.env` (required)
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=http://localhost:3000
```
Copy from `.env.example` and add MongoDB connection string.

### Mobile API Configuration
For phone testing, update `mobile/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3001/api';
```
Ensure phone and computer on same WiFi. Windows firewall rule may be needed:
```bash
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3001
```

## Data Flow

1. ESP32 sends sensor data via HTTP POST to `/api/telemetry`
2. Backend saves to MongoDB Telemetry collection and updates Forklift status
3. Frontend polls `/api/forklifts` every 10 seconds for real-time updates
4. Mobile app fetches on load and uses pull-to-refresh

## Activity State Classification

Forklifts have intelligent activity detection based on sensor fusion:
- **PARKED**: No movement, fork down, no load
- **IDLE**: Minimal movement, fork down
- **DRIVING**: In motion, fork down or raised
- **WORKING**: Fork raised with load or actively loading/unloading
- **CHARGING**: At charging station (RFID detected)
- **UNKNOWN**: Initial state or sensor malfunction

## Hardware Integration

System designed for ESP32 with:
- **Qorvo DWM1001-DEV**: UWB positioning (±10cm accuracy, replaces GPS indoors)
- **MPU6050**: Accelerometer/gyroscope for vibration and tilt
- **RC522**: RFID for station identification
- **HC-SR04** (4x): Ultrasonic sensors for fork height and collision detection
- **MicroSD**: Local data logging

Hardware code will go in `hardware/` directory (currently empty).

## Database Indexing

Telemetry schema has compound indexes for performance:
- `{ forkliftId: 1, timestamp: -1 }` - Latest readings per forklift
- `{ 'activity.state': 1 }` - Activity filtering
- TTL index: Auto-deletes telemetry older than 90 days

## API Response Pattern

All API responses follow consistent structure:
```javascript
{
  success: true,        // boolean
  data: [...],          // result data
  count: 5,            // optional: array length
  message: "..."       // optional: human-readable message
}
```

Errors return:
```javascript
{
  success: false,
  message: "Error description",
  error: "Technical details"
}
```

## Frontend State Management

Currently uses React component state with `useState` and `useEffect`. No Redux/Context yet. Auto-refresh implemented via `setInterval` in Dashboard component with cleanup on unmount.

## Testing the System

1. Start backend: `cd backend && npm run dev`
2. Seed data if needed: `npm run seed`
3. Start frontend: `cd frontend && npm start`
4. Verify connection at http://localhost:3000

Health check: http://localhost:3001/health

## Important Notes

- Frontend API service uses cache-busting (`?_t=timestamp`) to prevent stale data
- MongoDB connection must be established before routes are functional
- CORS is configured for localhost:3000 (update for production deployment)
- Telemetry data auto-expires after 90 days (TTL index)
- Mobile app requires IP address update for physical device testing
- BACKUP folders exist for Dashboard and ForkliftList (previous versions)
