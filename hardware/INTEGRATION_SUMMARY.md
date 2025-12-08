# MPU6050 Integration Summary

## What Was Implemented

Your colleague's ESP32 + MPU6050 files have been successfully integrated with your existing forklift tracking system using a **dual-database architecture**.

### Architecture Overview

```
┌─────────────────┐
│  ESP32 + MPU6050│ (5 Hz)
│  forklift_sensor.ino
└────────┬────────┘
         │ MQTT
         ▼
┌─────────────────┐
│  MQTT Broker    │
│  (Mosquitto)    │
└────────┬────────┘
         │ Subscribe
         ▼
┌─────────────────────────┐
│  Python Bridge          │  NEW: mqtt_bridge.py
│  (mqtt_bridge.py)       │
└───────┬─────────────┬───┘
        │             │
        │ 5Hz         │ 10s aggregated
        ▼             ▼
  ┌──────────┐  ┌──────────────┐
  │ InfluxDB │  │ MongoDB      │
  │ (raw)    │  │ (dashboard)  │
  └──────────┘  └──────────────┘
                     ▲
                     │ API
                ┌────┴────┐
                │ Node.js │
                │ Backend │
                └────┬────┘
                     │
                ┌────┴────┐
                │  React  │
                │Dashboard│
                └─────────┘
```

## Files Created/Modified

### Hardware Directory (New Files)
- **`mqtt_bridge.py`** - Dual-destination bridge (MQTT → InfluxDB + MongoDB)
- **`requirements.txt`** - Python dependencies
- **`README.md`** - Complete hardware setup guide
- **`env.template`** - Updated with MongoDB backend URL

### Backend Changes
- **`src/utils/activityClassifier.js`** (NEW) - Intelligent activity state classification
  - Analyzes sensor data to determine: PARKED, IDLE, DRIVING, WORKING, CHARGING
  - Uses vibration magnitude and tilt angle from MPU6050
  - Combines with ultrasonic and RFID for sensor fusion

- **`src/routes/telemetry.js`** (MODIFIED) - Auto-enriches telemetry data
  - Automatically classifies activity state on data arrival
  - Calculates derived metrics from sensor data

### Frontend Changes
- **`src/components/Dashboard/SensorMetrics.js`** (NEW) - MPU6050 data visualization
  - Displays vibration magnitude with severity levels
  - Shows tilt angle with warnings
  - Real-time accelerometer/gyroscope readings
  - Movement detection indicator

- **`src/components/Dashboard/SensorMetrics.css`** (NEW) - Styling for sensor display

- **`src/components/ForkliftList/ForkliftList.js`** (MODIFIED)
  - Added sensor metrics to forklift details modal
  - Fetches latest telemetry when viewing forklift details

## How the System Works

### 1. Data Collection (ESP32)
- MPU6050 reads accelerometer and gyroscope at 5Hz
- ESP32 publishes JSON via MQTT:
  ```json
  {
    "forklift_id": "forklift_1",
    "accel_x": 0.0245,
    "accel_y": -0.0123,
    "accel_z": 0.9876,
    "gyro_x": 0.12,
    "gyro_y": -0.34,
    "gyro_z": 0.56
  }
  ```

### 2. Data Processing (Python Bridge)
- Receives all MQTT messages
- **Path 1: InfluxDB** - Stores every sample (5Hz) for detailed analytics
- **Path 2: MongoDB** - Aggregates 50 samples over 10 seconds, calculates:
  - **Vibration magnitude**: RMS of total acceleration
  - **Tilt angle**: Computed from average accelerometer values
  - **Movement detection**: Based on vibration threshold (0.1g)
  - **Average gyroscope**: Mean rotation rates

### 3. Activity Classification (Backend)
When aggregated data arrives at MongoDB backend:
- **CHARGING**: RFID tag detected at charging station
- **WORKING**: Fork raised OR load detected
- **DRIVING**: Vibration > 0.15g AND movement detected
- **IDLE**: Vibration 0.05-0.15g (engine on, not moving)
- **PARKED**: Vibration < 0.05g AND no movement

### 4. Dashboard Display (Frontend)
- Forklift List → View Details → Sensor Data section shows:
  - Movement status (Moving/Stationary)
  - Vibration level with color coding (Low/Medium/High)
  - Tilt angle with warnings
  - Raw accelerometer X/Y/Z axes
  - Raw gyroscope X/Y/Z axes

## Setup Instructions

### Quick Start (Development)

1. **Start MQTT Broker** (already done if following colleague's setup)
   ```bash
   sudo systemctl start mosquitto
   ```

2. **Start InfluxDB** (already done if following colleague's setup)
   ```bash
   sudo systemctl start influxdb
   ```

3. **Configure Python Bridge**
   ```bash
   cd hardware
   cp env.template .env
   nano .env
   ```

   Update:
   ```bash
   MQTT_BROKER=localhost
   INFLUX_TOKEN=your_token_from_influxdb
   BACKEND_URL=http://localhost:3001/api/telemetry  # Your Node.js backend
   ```

4. **Install Python Dependencies**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Run the Bridge**
   ```bash
   export $(cat .env | xargs)  # Load env vars
   python mqtt_bridge.py
   ```

6. **Start Your Backend**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start Your Frontend**
   ```bash
   cd frontend
   npm start
   ```

8. **Upload ESP32 Code**
   - Update WiFi credentials and MQTT server IP in `forklift_sensor.ino`
   - Upload to ESP32 via Arduino IDE
   - Monitor serial output (115200 baud)

### Testing Without Hardware

To test the frontend changes without ESP32 hardware:

1. Use MQTT test publisher:
   ```bash
   mosquitto_pub -h localhost -t "forklift/mpu6050" -m '{
     "forklift_id": "forklift_1",
     "accel_x": 0.05,
     "accel_y": -0.02,
     "accel_z": 0.98,
     "gyro_x": 0.1,
     "gyro_y": -0.2,
     "gyro_z": 0.15
   }'
   ```

2. Or use the backend seed script to populate test data:
   ```bash
   cd backend
   npm run seed
   ```

## Expected Console Output

### Python Bridge
```
==================================================
Stera Forklift Dual-Database Bridge
MQTT → InfluxDB (high-frequency) + MongoDB (aggregated)
==================================================
MQTT Broker:     localhost:1883
MQTT Topic:      forklift/mpu6050
InfluxDB:        http://127.0.0.1:8086
InfluxDB Bucket: forklift_data
MongoDB Backend: http://localhost:3001/api/telemetry
Aggregation:     Every 10s (50 samples)
==================================================

[OK] Connected to MQTT broker at localhost:1883
[OK] Subscribing to topic: forklift/mpu6050
[InfluxDB] forklift_1: accel=0.987g
[InfluxDB] forklift_1: accel=0.985g
[InfluxDB] forklift_1: accel=0.989g
...
[InfluxDB] forklift_1: accel=0.986g | [Aggregated to MongoDB]
[MongoDB] Sent aggregated data for forklift_1
```

### Backend Console
```
POST /api/telemetry 201 45ms
Telemetry data received for forklift_1
Activity classified: IDLE (vibration: 0.08g, movement: false)
Forklift status updated
```

### Frontend Console
```
API: Fetching forklifts from http://localhost:3001/api/forklifts?_t=1733485920123
API: 1 forklifts fetched.
API: Fetching latest telemetry for forklift_1
```

## Dashboard Usage

1. **View Fleet Overview**
   - Navigate to Dashboard → Forklift List
   - See all forklifts with activity status badges

2. **View Sensor Details**
   - Click "View Details" on any forklift
   - Scroll to "Sensor Data (MPU6050)" section
   - See real-time:
     - Movement status (green dot = moving, gray = stationary)
     - Vibration magnitude (color-coded: green/yellow/red)
     - Tilt angle (Normal/Tilted/Warning)
     - Raw accelerometer and gyroscope values

3. **Activity State Indicators**
   - **PARKED**: Low vibration, no movement
   - **IDLE**: Moderate vibration, minimal movement
   - **DRIVING**: High vibration, active movement
   - **WORKING**: Fork raised or load detected
   - **CHARGING**: At charging station (RFID)

## Key Benefits of Dual Database

| Feature | InfluxDB | MongoDB |
|---------|----------|---------|
| **Frequency** | 5 Hz (all samples) | 10 seconds (aggregated) |
| **Use Case** | Detailed analytics, vibration analysis | Real-time dashboard |
| **Data Retention** | Long-term (configurable) | 90 days (TTL index) |
| **Query Speed** | Optimized for time-series | Optimized for business logic |
| **Storage Efficiency** | Compressed time-series | Aggregated summaries |

## Troubleshooting

### "No sensor data available" in Dashboard
- Check if Python bridge is running
- Verify backend is receiving telemetry (check backend logs)
- Ensure forklift has recent telemetry (check `lastSeen` timestamp)
- Try manual MQTT publish to test pipeline

### Python Bridge Connection Errors
- **MQTT**: Check `mosquitto` service status
- **InfluxDB**: Verify token and bucket name
- **MongoDB**: Ensure backend is running on port 3001

### ESP32 Not Publishing
- Check WiFi connection (LED should be solid)
- Verify MQTT server IP is correct (use `ifconfig` or `ipconfig`)
- Check serial monitor for error messages
- Ensure MPU6050 wiring is correct (SDA=GPIO21, SCL=GPIO22)

## Next Steps

1. **Production Deployment**
   - Set up Python bridge as systemd service (see `hardware/README.md`)
   - Configure TLS for MQTT
   - Use environment variables for secrets

2. **Multiple Forklifts**
   - Deploy multiple ESP32 nodes with unique `FORKLIFT_ID`
   - Python bridge handles all forklifts automatically
   - Dashboard will show all forklifts with sensor data

3. **Advanced Analytics**
   - Query InfluxDB directly for vibration trend analysis
   - Set up Grafana dashboards for real-time monitoring
   - Create alerts for abnormal vibration patterns

4. **Additional Sensors**
   - Integrate GPS/UWB for positioning (already in schema)
   - Add ultrasonic sensors for fork height
   - Add RFID for station detection
   - All sensors follow the same dual-database pattern

## Files Reference

### Read These Files For More Details:
- **`hardware/README.md`** - Complete hardware setup guide
- **`hardware/INFRASTRUCTURE_SETUP.md`** - Original MQTT + InfluxDB setup (from colleague)
- **`backend/src/utils/activityClassifier.js`** - Activity classification logic
- **`frontend/src/components/Dashboard/SensorMetrics.js`** - Sensor display component

### Configuration Files:
- **`hardware/.env`** - Python bridge configuration
- **`hardware/env.template`** - Environment template
- **`hardware/forklift_sensor.ino`** - ESP32 code (update WiFi/MQTT settings)

## Support

If you encounter issues:
1. Check console logs for all services (Python bridge, backend, frontend)
2. Verify all services are running (MQTT, InfluxDB, MongoDB, Node.js)
3. Test each component independently (MQTT pub/sub, API endpoints)
4. Review the relevant README files in each directory

---

**Integration completed successfully!** Your system now supports high-frequency sensor data collection with intelligent activity classification and real-time dashboard display.
