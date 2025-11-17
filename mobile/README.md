# Stera IoT Mobile App

Professional React Native mobile application for real-time forklift fleet monitoring. Built with Expo for cross-platform deployment (iOS & Android).

![Stera IoT Mobile](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb)
![Expo](https://img.shields.io/badge/Expo-~54.0-000020)

## Features

### Real-Time Fleet Monitoring
- **Live Dashboard**: View all 20 forklifts with real-time updates every 10 seconds
- **Fleet Statistics**: Total count, active units, working units, and average battery level
- **Auto-Refresh**: Automatic data updates without manual intervention
- **Pull-to-Refresh**: Manual refresh capability with smooth animations

### Comprehensive Forklift Details
- **GPS & Movement**: Live location tracking, speed, satellite count
- **Battery Status**: Real-time battery levels with color-coded indicators
- **Fork Status**: Height, state, and load detection
- **Safety Monitoring**: Obstacle detection, warning alerts
- **Activity Tracking**: Engine status, motion detection, vibration monitoring
- **RFID Integration**: Station detection and identification

### User Experience
- **Search & Filter**: Find forklifts by name, ID, or model
- **Sort Options**: Sort by name, battery level, or activity status
- **Smooth Animations**: Professional transitions and interactions
- **Share Functionality**: Export forklift data via native share dialog
- **Offline Handling**: Graceful error messages and retry options
- **Loading States**: Skeleton screens and activity indicators

### Design
- **Stera Branding**: Consistent orange (#f97316) theme throughout
- **Dark Theme**: Matches web dashboard with dark backgrounds (#1a202c, #2d3748)
- **Material Design**: Cards, shadows, and elevation
- **Responsive Layout**: Optimized for all screen sizes
- **Professional UI**: Clean, modern interface with proper spacing
- **Animated Elements**: Pulsing LIVE indicator, smooth transitions
- **Comprehensive Dashboard**: Full analytics matching web application

## Prerequisites

Before running the mobile app, ensure you have:

1. **Node.js**: Version 16 or higher
   ```bash
   node --version  # Should be v16.x or higher
   ```

2. **Expo CLI** (optional but recommended):
   ```bash
   npm install -g expo-cli
   ```

3. **Mobile Device or Emulator**:
   - **iOS**: Xcode simulator (macOS only) or physical iPhone with Expo Go app
   - **Android**: Android Studio emulator or physical Android device with Expo Go app

4. **Backend Server Running**:
   - The Stera IoT backend must be running on port 3001
   - See `../backend/README.md` for setup instructions

## Installation

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages:
- React Navigation (navigation system)
- Axios (API client)
- date-fns (date formatting)
- Expo SDK (platform APIs)

### 3. Configure API Connection

**IMPORTANT**: The mobile app needs to connect to your backend server. Since mobile devices can't use `localhost`, you need to configure the API endpoint.

Edit `mobile/services/api.js` and set your computer's IP address:

```javascript
// Line 6 in services/api.js
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3001';
```

**How to Find Your IP Address:**

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

**macOS/Linux:**
```bash
ifconfig
# Look for "inet" under your active network (usually en0 or wlan0)
# Example: 192.168.1.100
```

**Example Configuration:**
```javascript
const API_BASE_URL = 'http://192.168.1.100:3001';
```

> **Note**: Your mobile device and computer must be on the same Wi-Fi network!

### 4. Ensure Backend is Running

Before starting the mobile app, make sure the backend server is running:

```bash
# In a separate terminal, from the project root
cd backend
npm start

# You should see:
# Server running on http://localhost:3001
# Connected to MongoDB
```

## Running the App

### Start Expo Development Server

```bash
npm start
```

This will start the Expo development server and display a QR code in the terminal.

### Run on Physical Device (Recommended for Testing)

1. **Install Expo Go App**:
   - **iOS**: Download from [App Store](https://apps.apple.com/us/app/expo-go/id982107779)
   - **Android**: Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code**:
   - **iOS**: Use the built-in Camera app to scan the QR code
   - **Android**: Use the Expo Go app to scan the QR code

3. **Wait for App to Load**: The app will download and launch automatically

### Run on iOS Simulator (macOS Only)

```bash
npm run ios
```

This will launch the iOS simulator and run the app.

### Run on Android Emulator

```bash
npm run android
```

This will launch the Android emulator and run the app.

> **Note**: Make sure you have Android Studio installed with at least one AVD (Android Virtual Device) configured.

## Project Structure

```
mobile/
├── App.js                      # Root component with navigation setup
├── screens/
│   ├── HomeScreen.js          # Fleet list and dashboard
│   └── DetailsScreen.js       # Detailed forklift view
├── services/
│   └── api.js                 # API client with all endpoints
├── utils/
│   └── formatters.js          # Data formatting utilities
├── styles/
│   └── theme.js               # Centralized theme (colors, spacing, typography)
├── assets/                    # Images and icons
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Key Components

### HomeScreen (`screens/HomeScreen.js`)

The comprehensive fleet management dashboard screen matching the web application design:

#### Header Section
- **Stera Logo**: Professional branding with white logo container
- **Dashboard Title**: "Forklift Fleet Management Dashboard"
- **LIVE Indicator**: Animated pulsing dot showing real-time connection
- **Connection Status**: Visual indicator (Connected/Disconnected)

#### Statistics Cards (2x2 Grid)
- **Total Forklifts**: Total count of all forklifts in fleet
- **Active**: Count of forklifts in DRIVING, WORKING, or IDLE states
- **Working**: Count of forklifts currently working
- **Avg Battery**: Average battery level across entire fleet

#### Analytics Section
Comprehensive analytics matching the web dashboard:

**Activity Distribution Card**
- Real-time breakdown of all forklift activities (DRIVING, WORKING, IDLE, PARKED, CHARGING)
- Horizontal bar charts with percentages
- Color-coded activity icons
- Summary showing productive vs standby units

**Battery Status Card**
- Large circular gauge showing average battery percentage
- Statistics grid showing:
  - Good batteries (≥50%)
  - Warning batteries (20-49%)
  - Critical batteries (<20%)
- Alert banner when forklifts need charging

**Fleet Performance Card**
- Fleet utilization percentage with color-coded bar
- Productive units count (DRIVING + WORKING)
- Standby units count (IDLE + PARKED)

#### Fleet Overview Section
- **Search Bar**: Filter forklifts by name, ID, or model
- **Sort Buttons**: Sort by name, battery, or activity
- **Forklift Cards**: Detailed list of all forklifts
- **Auto-Refresh**: Updates every 10 seconds
- **Pull-to-Refresh**: Manual refresh with smooth animations

Key Features:
```javascript
- Real-time data updates (10s interval)
- Animated LIVE indicator (pulsing effect)
- Comprehensive analytics (activity, battery, performance)
- Search filtering with instant results
- Multiple sort options
- Smooth scroll animations
- Loading states with spinners
- Empty states with helpful messages
- Dark theme matching web dashboard
- Stera orange branding throughout
```

### DetailsScreen (`screens/DetailsScreen.js`)

Comprehensive forklift details with:
- **Header Card**: Forklift icon, name, ID, activity badge
- **Quick Stats**: Battery and status at a glance
- **Info Sections**:
  - Basic Information (model, serial, location)
  - GPS & Movement (coordinates, speed, satellites)
  - Fork Status (height, state, load detection)
  - Activity & Engine (engine state, vibration, tilt)
  - Safety & Obstacles (front/rear warnings)
  - RFID Station (if detected)
  - Last Update timestamp
- **Share Button**: Export data via native share

Key Features:
```javascript
- Real-time telemetry (5s interval)
- Pull-to-refresh
- Native share functionality
- Color-coded indicators
- Formatted data display
```

## API Service (`services/api.js`)

Centralized API client with the following methods:

```javascript
// Health check
api.healthCheck()

// Get all forklifts
api.getForklifts()                    // Returns array of forklifts

// Get forklift by ID
api.getForkliftById(id)               // Returns single forklift

// Get latest telemetry for forklift
api.getLatestTelemetry(forkliftId)    // Returns telemetry data

// Get all telemetry
api.getTelemetry()                    // Returns array of telemetry

// Get all stations
api.getStations()                     // Returns array of RFID stations
```

All methods include:
- Cache-busting with timestamp parameters
- Error handling
- Timeout configuration (10s)
- Proper headers for API communication

## Theme System (`styles/theme.js`)

Centralized design system with:

### Colors
```javascript
COLORS.primary              // #f97316 (Stera Orange)
COLORS.success              // #10b981 (Green)
COLORS.warning              // #f59e0b (Amber)
COLORS.error                // #ef4444 (Red)

// Dark Theme Backgrounds (matching web dashboard)
COLORS.background.primary   // #1a202c (Dark background)
COLORS.background.secondary // #2d3748 (Card background)

// Text Colors (optimized for dark backgrounds)
COLORS.text.primary         // #ffffff (White)
COLORS.text.secondary       // #a0aec0 (Light gray)
COLORS.text.tertiary        // #718096 (Medium gray)

COLORS.activity.*           // Activity status colors
COLORS.battery.*            // Battery level colors
```

### Spacing
```javascript
SPACING.xs    // 4px
SPACING.sm    // 8px
SPACING.md    // 12px
SPACING.lg    // 16px
SPACING.xl    // 20px
// ... up to SPACING.huge (40px)
```

### Typography
```javascript
TYPOGRAPHY.fontSize.*    // Font sizes (xs to massive)
TYPOGRAPHY.fontWeight.*  // Font weights (normal to heavy)
TYPOGRAPHY.lineHeight.*  // Line heights
```

### Shadows & Border Radius
```javascript
SHADOWS.sm, SHADOWS.md, SHADOWS.lg, SHADOWS.xl
BORDER_RADIUS.sm, BORDER_RADIUS.md, BORDER_RADIUS.lg, BORDER_RADIUS.round
```

## Formatters (`utils/formatters.js`)

Utility functions for consistent data formatting:

```javascript
// Numbers
formatNumber(num)              // "1,234"
formatDecimal(num, decimals)   // "1,234.56"
formatPercentage(num)          // "75%"

// GPS & Location
formatCoordinates(lat, lng)    // "40.7128, -74.0060"
formatCoordinate(coord)        // "40.7128"
formatDistance(km)             // "12.5 km"
formatSpeed(speed)             // "5.5 km/h"

// Time & Date
formatDate(date)               // "Jan 15, 2025"
formatDateTime(date)           // "Jan 15, 2025 3:30 PM"
formatTime(date)               // "3:30 PM"
formatRelativeTime(date)       // "5 minutes ago"

// Forklift-specific
formatBattery(level)           // "75%"
getBatteryColor(level)         // Returns color hex
getBatteryStatus(level)        // "Good", "Low", etc.
getActivityColor(activity)     // Returns color hex
```

## Troubleshooting

### App Won't Connect to Backend

**Problem**: "Failed to fetch forklifts" or connection errors

**Solutions**:
1. Verify backend is running on port 3001
2. Check that your mobile device and computer are on the same Wi-Fi network
3. Confirm the IP address in `services/api.js` is correct
4. Try disabling firewall temporarily to test
5. For iOS simulator, use `http://localhost:3001` instead of IP address
6. For Android emulator, use `http://10.0.2.2:3001` instead of IP address

### QR Code Won't Scan

**Problem**: Expo Go app can't scan the QR code

**Solutions**:
1. Make sure your phone and computer are on the same network
2. Try typing the URL manually in Expo Go
3. Use tunnel mode: `expo start --tunnel`

### App Crashes on Startup

**Problem**: App closes immediately after opening

**Solutions**:
1. Clear Expo cache: `expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check console for error messages
4. Ensure all dependencies are compatible

### Data Not Updating

**Problem**: Forklift data is stale or not refreshing

**Solutions**:
1. Pull down to manually refresh
2. Check network connection
3. Verify backend seed data is running
4. Check browser console for API errors

### Slow Performance

**Problem**: App is laggy or unresponsive

**Solutions**:
1. Use production build instead of development
2. Close other apps on your device
3. Restart the Expo development server
4. Check if auto-refresh interval is too aggressive

## Development Tips

### Fast Refresh
- Code changes automatically reload in the app
- Shake device to open developer menu
- Press `r` in terminal to reload manually
- Press `m` in terminal to toggle menu

### Debugging
- Shake device and select "Debug Remote JS"
- Use Chrome DevTools for debugging
- Add `console.log()` statements for debugging
- Use React DevTools browser extension

### Testing Network Requests
- Use the Network tab in Chrome DevTools
- Check API responses in browser console
- Test with Postman or similar tools first
- Verify backend logs show incoming requests

### Performance Optimization
- Use FlatList for long lists (already implemented)
- Implement React.memo for expensive components
- Minimize re-renders with proper state management
- Use native modules for intensive operations

## Building for Production

### Create APK (Android)

```bash
eas build --platform android
```

### Create IPA (iOS)

```bash
eas build --platform ios
```

> **Note**: You'll need to sign up for an Expo account and configure EAS Build. See [Expo documentation](https://docs.expo.dev/build/introduction/) for details.

## Environment Configuration

For production deployment, create environment-specific configurations:

```javascript
// Example environment config
const ENV = {
  dev: {
    apiUrl: 'http://192.168.1.100:3001',
  },
  staging: {
    apiUrl: 'https://staging-api.stera.com',
  },
  production: {
    apiUrl: 'https://api.stera.com',
  }
};
```

## Additional Features (Future Enhancements)

Potential additions for future versions:

1. **Map View**: Display forklift locations on an interactive map
2. **Analytics Screen**: Charts and graphs for fleet performance
3. **Notifications**: Push notifications for alerts and warnings
4. **Offline Mode**: Cache data for offline viewing
5. **User Authentication**: Login and role-based access
6. **Historical Data**: View past performance and trends
7. **Export Reports**: Generate PDF or CSV reports
8. **Settings Screen**: Customize refresh intervals and preferences
9. **Dark Mode**: Theme switching capability
10. **Multi-language**: Internationalization support

## Support

For issues or questions:
- Check backend logs: `cd backend && npm start`
- Review API responses in network tab
- Verify database has data: Check MongoDB Compass
- Contact development team with error logs

## Technology Stack

- **React Native**: 0.81.5
- **Expo**: ~54.0
- **React Navigation**: Latest
- **Axios**: API client
- **date-fns**: Date utilities

## License

Stera IoT Platform - Proprietary Software

---

**Built with precision for real-time fleet management**
