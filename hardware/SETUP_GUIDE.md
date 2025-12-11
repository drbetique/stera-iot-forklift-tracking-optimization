# ESP32 + MPU6050 Hardware Setup Guide

Complete guide to connect your ESP32 microcontroller with MPU6050 sensor and start sending live data to your Stera IoT backend.

---

## 📦 What You Need

### Hardware
- ✅ **ESP32 Development Board** (ESP32-WROOM-32 or similar)
- ✅ **MPU6050 Sensor Module** (6-axis accelerometer/gyroscope)
- 🔌 **4 Jumper Wires** (Female-to-Female recommended)
- 💻 **USB Cable** (Micro-USB or USB-C depending on your ESP32)

### Software
- 🖥️ **Arduino IDE** (Version 2.0+ recommended)
- 📚 **Required Libraries** (we'll install these)

---

## 🔌 Step 1: Hardware Wiring

Connect your MPU6050 to ESP32 following this diagram:

```
┌─────────────┐              ┌─────────────┐
│   ESP32     │              │   MPU6050   │
│             │              │             │
│  3.3V  ─────┼──────────────┼───►  VCC    │
│  GND   ─────┼──────────────┼───►  GND    │
│  GPIO 21 ───┼──────────────┼───►  SDA    │
│  GPIO 22 ───┼──────────────┼───►  SCL    │
│             │              │             │
└─────────────┘              └─────────────┘
```

### Pin Connections:
| ESP32 Pin | MPU6050 Pin | Wire Color (Suggested) |
|-----------|-------------|------------------------|
| 3.3V      | VCC         | Red                    |
| GND       | GND         | Black                  |
| GPIO 21   | SDA         | Blue                   |
| GPIO 22   | SCL         | Yellow                 |

⚠️ **IMPORTANT:**
- Use **3.3V**, NOT 5V (MPU6050 is a 3.3V device)
- Double-check connections before powering on
- SDA = Serial Data, SCL = Serial Clock (I2C communication)

---

## 💻 Step 2: Install Arduino IDE

### Download and Install

1. Go to: https://www.arduino.cc/en/software
2. Download **Arduino IDE 2.x** for Windows
3. Run the installer and follow the setup wizard
4. Launch Arduino IDE after installation

### Add ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Boards Manager URLs", paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. Search for **"esp32"**
7. Install **"esp32 by Espressif Systems"** (latest version)
8. Wait for installation to complete (may take 2-5 minutes)

---

## 📚 Step 3: Install Required Libraries

### Library 1: Adafruit MPU6050

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for **"Adafruit MPU6050"**
3. Click **Install**
4. When prompted to install dependencies, click **Install All**

This will also install:
- Adafruit Unified Sensor
- Adafruit BusIO

### Library 2: HTTPClient

Already included with ESP32 board package - no installation needed!

---

## 🔧 Step 4: Configure Your Code

### Open the Arduino Sketch

1. Navigate to: `C:\Users\victo\stera-iot-project\hardware\forklift_sensor\`
2. Open **`forklift_sensor_http.ino`** with Arduino IDE

### Update Configuration (Lines 23-35)

Find these lines and update with YOUR values:

```cpp
//==================================================
// CONFIGURATION - UPDATE THESE VALUES!
//==================================================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_NAME";        // ← Change this to your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // ← Change this to your WiFi password

// Backend API URL (already correct)
const char* API_URL = "https://stera-iot-backend.onrender.com/api/telemetry";

// Forklift Configuration
const char* FORKLIFT_ID = "FL001";  // ← Change if you want a different ID
const char* FORKLIFT_NAME = "Forklift 1";
```

**Example:**
```cpp
const char* WIFI_SSID = "MyHomeWiFi";
const char* WIFI_PASSWORD = "MySecurePassword123";
const char* FORKLIFT_ID = "FL001";
```

⚠️ **Important Notes:**
- WiFi must be **2.4 GHz** (ESP32 doesn't support 5 GHz)
- Use the **same WiFi network** as your computer (for testing)
- FORKLIFT_ID must match a forklift in your database (FL001, FL002, FL003 exist from seed data)

---

## 📤 Step 5: Upload Code to ESP32

### Select Your Board

1. Connect ESP32 to your computer via USB
2. Go to **Tools → Board → esp32 → ESP32 Dev Module**
3. Go to **Tools → Port** and select your ESP32 COM port (e.g., COM3, COM4)
   - If you don't see a port, install CH340 or CP2102 USB drivers
   - Windows: Check Device Manager → Ports (COM & LPT)

### Upload Settings

Configure these settings in the **Tools** menu:

```
Board: "ESP32 Dev Module"
Upload Speed: "921600"
CPU Frequency: "240MHz (WiFi/BT)"
Flash Frequency: "80MHz"
Flash Mode: "QIO"
Flash Size: "4MB (32Mb)"
Partition Scheme: "Default 4MB with spiffs"
Core Debug Level: "None"
Port: [Your COM Port]
```

### Compile and Upload

1. Click the **Verify** button (✓) to compile
   - Wait for "Done compiling" message
   - Check for any errors in the output window
2. Click the **Upload** button (→) to flash
   - Wait for "Connecting..." message
   - If it hangs, **press and hold BOOT button** on ESP32 for 2 seconds
   - Wait for "Hard resetting via RTS pin..." message
   - Upload complete when you see "Leaving... Hard resetting..."

---

## 🔍 Step 6: Monitor Serial Output

### Open Serial Monitor

1. Go to **Tools → Serial Monitor**
2. Set baud rate to **115200** (bottom right dropdown)
3. You should see output like this:

```
========================================
    Stera IoT - Forklift Sensor
========================================

Connecting to WiFi: MyHomeWiFi
.......

✓ WiFi Connected!
IP Address: 192.168.1.45
Signal Strength: -52 dBm

Initializing MPU6050...
✓ MPU6050 Found!

MPU6050 Configuration:
  Accelerometer: ±8g
  Gyroscope: ±500°/s
  Filter: 21 Hz

========================================
System Ready - Starting Data Stream
========================================

Sending data...
Payload: {"forkliftId":"FL001","timestamp":"12345",...}
✓ Response Code: 200
✓ Response: {"success":true,"message":"Telemetry data received"}

Sensor Readings:
  Accel: X=0.12 Y=-0.05 Z=0.98 g
  Gyro:  X=2.3 Y=-1.5 Z=0.8 °/s
  Temp:  26.5°C
  Vibration: 0.985 g
  Activity: PARKED

----------------------------------------
```

### What Each Status Means

| Status | Meaning |
|--------|---------|
| ✓ WiFi Connected | ESP32 successfully connected to your WiFi |
| ✓ MPU6050 Found! | Sensor is wired correctly and responding |
| Response Code: 200 | Backend received the data successfully |
| Response Code: 404 | Backend endpoint not found (check API_URL) |
| Response Code: 500 | Backend server error (check backend logs) |
| ✗ Error sending data | No internet or backend is down |

---

## 🧪 Step 7: Verify Data in Dashboard

### Check Backend

1. Open browser and go to: https://stera-iot-backend.onrender.com/api/telemetry/FL001/latest
2. You should see JSON response with latest sensor data:
   ```json
   {
     "success": true,
     "data": {
       "forkliftId": "FL001",
       "timestamp": "2025-12-09T12:34:56.789Z",
       "accelerometer": {
         "accel_x": 0.12,
         "accel_y": -0.05,
         "accel_z": 0.98,
         "temperature": 26.5,
         "vibrationMagnitude": 0.985
       },
       "activity": {
         "state": "PARKED"
       }
     }
   }
   ```

### Check Frontend Dashboard

1. Go to your frontend: http://localhost:3000 (or Vercel URL after deployment)
2. Look at the **Fleet Overview** section
3. Find **FL001** card
4. You should see:
   - Updated timestamp
   - Real-time sensor values
   - Activity state changing based on movement

---

## 🎯 Step 8: Test Sensor Movement

### Test Different Activity States

Move your MPU6050 sensor to test activity classification:

| Movement | Expected Activity | Vibration Level |
|----------|------------------|-----------------|
| Sensor sitting still | PARKED | < 1.0 g |
| Gentle tilt/movement | IDLE | 1.0 - 2.0 g |
| Shake moderately | DRIVING | 2.0 - 4.0 g |
| Shake vigorously | WORKING | > 4.0 g |

Watch the Serial Monitor and Dashboard to see real-time updates!

---

## 🐛 Troubleshooting

### Issue 1: "Failed to find MPU6050 chip!"

**Possible Causes:**
- Incorrect wiring (check all 4 connections)
- MPU6050 using 5V instead of 3.3V
- Damaged sensor or loose connections

**Solution:**
1. Disconnect USB power
2. Double-check all pin connections
3. Ensure MPU6050 VCC connected to ESP32 **3.3V** (not 5V)
4. Try swapping SDA/SCL wires
5. Test MPU6050 with I2C scanner sketch

### Issue 2: "WiFi Connection Failed!"

**Possible Causes:**
- Wrong WiFi SSID or password
- 5 GHz WiFi (ESP32 only supports 2.4 GHz)
- WiFi signal too weak

**Solution:**
1. Verify WiFi credentials in code
2. Check WiFi is 2.4 GHz band
3. Move ESP32 closer to router
4. Check router allows new device connections

### Issue 3: "Error sending data: -1" or "Error sending data: -11"

**Possible Causes:**
- Backend server is down or sleeping (Render free tier)
- No internet connection
- Wrong API_URL

**Solution:**
1. Open backend URL in browser: https://stera-iot-backend.onrender.com/health
2. Wait 30 seconds for Render to wake up (free tier spins down)
3. Verify API_URL in code matches your backend
4. Check if ESP32 has internet (ping 8.8.8.8)

### Issue 4: "Brownout detector was triggered"

**Possible Causes:**
- USB power not sufficient
- Too many peripherals drawing power
- Faulty USB cable

**Solution:**
1. Use a high-quality USB cable
2. Try a different USB port (USB 3.0 provides more power)
3. Use external 5V power supply (via VIN pin)

### Issue 5: "Connecting..." stuck during upload

**Solution:**
1. **Hold BOOT button** on ESP32
2. Click Upload in Arduino IDE
3. Keep holding BOOT until you see "Writing at 0x00001000..."
4. Release BOOT button

### Issue 6: Response Code 404 - Backend Not Found

**Possible Causes:**
- API_URL is incorrect
- Backend not deployed properly

**Solution:**
1. Test backend health endpoint in browser:
   ```
   https://stera-iot-backend.onrender.com/health
   ```
2. Verify API_URL in code:
   ```cpp
   const char* API_URL = "https://stera-iot-backend.onrender.com/api/telemetry";
   ```
3. Check backend logs in Render dashboard

---

## 📊 Understanding Sensor Data

### Accelerometer Values

- **Measured in:** g (gravitational force, where 1g = 9.81 m/s²)
- **Range:** ±8g in this configuration
- **What it measures:** Linear acceleration in X, Y, Z axes
- **Still sensor:** Should read approximately (0, 0, 1) with Z pointing up

### Gyroscope Values

- **Measured in:** °/s (degrees per second)
- **Range:** ±500°/s in this configuration
- **What it measures:** Rotational velocity around X, Y, Z axes
- **Still sensor:** Should read close to (0, 0, 0)

### Temperature

- **Measured in:** °C (Celsius)
- **Range:** -40°C to +85°C
- **Location:** Internal temperature of MPU6050 chip
- **Normal range:** 20-30°C at room temperature

### Vibration Magnitude

- **Calculated as:** √(ax² + ay² + az²)
- **Purpose:** Single value representing total movement/vibration
- **Used for:** Activity state classification

---

## 🔄 Next Steps

### 1. Deploy Frontend to Vercel

Your backend is live, now deploy the frontend to access dashboard from anywhere!

### 2. Register More Forklifts

Add more ESP32 devices with different FORKLIFT_IDs:
```cpp
const char* FORKLIFT_ID = "FL002";  // Different ID for each device
```

### 3. Enhance Sensor Array

Add more sensors as planned:
- **UWB (DWM1001):** Indoor positioning (±10cm accuracy)
- **HC-SR04 (x4):** Ultrasonic distance sensors for fork height
- **RC522:** RFID reader for station identification
- **MicroSD:** Local data logging for offline operation

### 4. Mount on Actual Forklift

- Secure ESP32 in weatherproof enclosure
- Use industrial power supply (12V/24V to 5V converter)
- Position MPU6050 to detect vibrations effectively
- Consider antenna placement for WiFi signal

---

## 📖 Additional Resources

### ESP32 Documentation
- Official ESP32 Docs: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/
- Arduino-ESP32 GitHub: https://github.com/espressif/arduino-esp32

### MPU6050 Documentation
- Adafruit MPU6050 Guide: https://learn.adafruit.com/mpu6050-6-dof-accelerometer-and-gyro
- Datasheet: https://invensense.tdk.com/products/motion-tracking/6-axis/mpu-6050/

### Backend API Documentation
- Health Check: https://stera-iot-backend.onrender.com/health
- API Root: https://stera-iot-backend.onrender.com/api

---

## ✅ Success Checklist

Before considering your hardware setup complete, verify:

- [ ] ESP32 connects to WiFi successfully
- [ ] MPU6050 sensor initialized without errors
- [ ] Serial Monitor shows sensor readings every second
- [ ] Backend returns HTTP 200 responses
- [ ] Latest telemetry data visible at `/api/telemetry/FL001/latest`
- [ ] Dashboard shows real-time data updates
- [ ] Activity state changes when sensor is moved
- [ ] Temperature readings are reasonable (20-30°C)
- [ ] No brownout or power issues

---

## 🆘 Need Help?

If you're stuck:

1. **Check Serial Monitor** - errors are usually clearly indicated
2. **Test backend separately** - open health endpoint in browser
3. **Verify wiring** - most issues are loose connections
4. **Check WiFi** - ensure 2.4 GHz and correct credentials
5. **Review Render logs** - check if backend is receiving data

---

**🎉 Congratulations!** You now have a live IoT sensor streaming real-time data to your cloud backend!

Next: Deploy your frontend to Vercel and access your dashboard from anywhere in the world! 🚀
