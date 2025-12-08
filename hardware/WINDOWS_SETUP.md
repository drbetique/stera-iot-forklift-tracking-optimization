# Windows Setup Guide for MPU6050 Integration

## Prerequisites
✅ Python 3.12.3 (Already installed)
✅ Node.js Backend running on port 3001
✅ React Frontend running on port 3000

## Installation Steps

### 1. Install Mosquitto MQTT Broker

**Download:**
- Go to: https://mosquitto.org/download/
- Download: **mosquitto-2.0.18-install-windows-x64.exe** (latest version)

**Install:**
1. Run the installer as Administrator
2. Keep default installation path: `C:\Program Files\mosquitto`
3. Check "Service" during installation
4. Click Install

**Configure:**
1. Open Command Prompt as Administrator
2. Navigate to Mosquitto directory:
   ```cmd
   cd "C:\Program Files\mosquitto"
   ```

3. Create config file:
   ```cmd
   notepad mosquitto.conf
   ```

4. Add these lines:
   ```
   listener 1883
   allow_anonymous true
   ```

5. Save and close

**Start Service:**
```cmd
net stop mosquitto
net start mosquitto
```

**Test:**
Open two Command Prompts:

Terminal 1 (Subscribe):
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_sub -h localhost -t "test" -v
```

Terminal 2 (Publish):
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_pub -h localhost -t "test" -m "hello"
```

You should see "hello" appear in Terminal 1.

---

### 2. Install InfluxDB

**Download:**
- Go to: https://portal.influxdata.com/downloads/
- Select: **InfluxDB v2.x** > **Windows**
- Download: **influxdb2-2.7.10-windows-amd64.zip**

**Install:**
1. Extract ZIP to: `C:\influxdb2`
2. Open Command Prompt as Administrator
3. Navigate to InfluxDB:
   ```cmd
   cd C:\influxdb2
   ```

4. Start InfluxDB:
   ```cmd
   influxd
   ```
   (Keep this terminal open)

**Setup (First Time):**
1. Open browser: http://localhost:8086
2. Click "Get Started"
3. Fill in:
   - **Username**: admin
   - **Password**: admin123456 (or your choice)
   - **Organization**: HAMK
   - **Bucket Name**: forklift_data
4. Click "Continue"
5. **IMPORTANT**: Copy the API Token shown - you'll need this!
6. Save it somewhere safe

**Alternative CLI Setup:**
In a new terminal:
```cmd
cd C:\influxdb2
influx setup ^
  --org HAMK ^
  --bucket forklift_data ^
  --username admin ^
  --password admin123456 ^
  --force
```
Save the token from the output.

---

### 3. Python Environment Setup

**Create Virtual Environment:**
```cmd
cd C:\Users\victo\stera-iot-project\hardware
python -m venv venv
```

**Activate Virtual Environment:**
```cmd
venv\Scripts\activate
```

**Install Dependencies:**
```cmd
pip install -r requirements.txt
```

---

### 4. Configure Python Bridge

**Create .env file:**
```cmd
copy env.template .env
notepad .env
```

**Edit .env with your settings:**
```env
# MQTT Broker Settings
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC=forklift/mpu6050

# InfluxDB Settings
INFLUX_URL=http://127.0.0.1:8086
INFLUX_TOKEN=YOUR_ACTUAL_TOKEN_HERE  # Paste token from InfluxDB setup
INFLUX_ORG=HAMK
INFLUX_BUCKET=forklift_data

# MongoDB Backend Settings
BACKEND_URL=http://localhost:3001/api/telemetry

# Data Aggregation Settings
AGGREGATE_INTERVAL=10
AGGREGATE_SAMPLE_SIZE=50

# Default Forklift ID
FORKLIFT_ID=forklift_1
```

Save and close.

---

### 5. Run the Python Bridge

**In hardware directory with venv activated:**
```cmd
python mqtt_bridge.py
```

You should see:
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
```

---

### 6. Test the Pipeline

**Open a new terminal and publish test data:**
```cmd
cd "C:\Program Files\mosquitto"
mosquitto_pub -h localhost -t "forklift/mpu6050" -m "{\"forklift_id\":\"forklift_1\",\"accel_x\":0.05,\"accel_y\":-0.02,\"accel_z\":0.98,\"gyro_x\":0.15,\"gyro_y\":-0.22,\"gyro_z\":0.08}"
```

**Check Python bridge terminal** - you should see:
```
[InfluxDB] forklift_1: accel=0.987g
```

**After 10 seconds**, you should also see:
```
[MongoDB] Sent aggregated data for forklift_1
```

**Check your React dashboard** at http://localhost:3000:
- Click "View Details" on forklift_1
- Scroll to "Sensor Data (MPU6050)"
- You should see the sensor readings!

---

## Running Everything (After Initial Setup)

1. **Start InfluxDB** (in one terminal):
   ```cmd
   cd C:\influxdb2
   influxd
   ```

2. **Start Mosquitto** (if not running as service):
   ```cmd
   net start mosquitto
   ```

3. **Start Backend** (if not running):
   ```cmd
   cd C:\Users\victo\stera-iot-project\backend
   npm run dev
   ```

4. **Start Frontend** (if not running):
   ```cmd
   cd C:\Users\victo\stera-iot-project\frontend
   npm start
   ```

5. **Start Python Bridge**:
   ```cmd
   cd C:\Users\victo\stera-iot-project\hardware
   venv\Scripts\activate
   python mqtt_bridge.py
   ```

---

## Troubleshooting

### Mosquitto Service Won't Start
```cmd
# Check if port 1883 is already in use
netstat -ano | findstr :1883

# Restart service
net stop mosquitto
net start mosquitto
```

### InfluxDB Connection Error
- Make sure InfluxDB is running (`influxd` terminal still open)
- Check token is correct in `.env`
- Verify bucket name: `forklift_data`

### Python Bridge Errors
- Make sure virtual environment is activated (`venv\Scripts\activate`)
- Check all dependencies installed: `pip list`
- Verify MQTT broker is running: `net start mosquitto`

### Can't Install as Service (Permission Denied)
- Right-click Command Prompt → "Run as Administrator"
- Try again

---

## Next Step: ESP32 Hardware

Once the pipeline is working with test data, you can:
1. Flash `forklift_sensor.ino` to ESP32
2. Update WiFi credentials and MQTT server IP in the code
3. Connect MPU6050 to ESP32
4. Power on and watch data flow automatically!

