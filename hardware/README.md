# Stera Forklift Hardware Integration

ESP32 + MPU6050 sensor integration with dual-database architecture for real-time IoT forklift tracking.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────────────┐
│  ESP32 + MPU6050│────▶│  MQTT Broker    │────▶│  Python Bridge (mqtt_bridge.py) │
│  (Sensor Node)  │     │  (Mosquitto)    │     │                                 │
└─────────────────┘     └─────────────────┘     └────────┬───────────────┬────────┘
        │                       │                         │               │
    5 Hz JSON              Port 1883                      │               │
    via WiFi                                              ▼               ▼
                                                  ┌──────────────┐ ┌──────────────┐
                                                  │  InfluxDB    │ │  MongoDB     │
                                                  │ (High-freq)  │ │ (Dashboard)  │
                                                  └──────────────┘ └──────────────┘
                                                    5 Hz raw data    10s aggregated
```

## Key Features

- **Dual Database Strategy**:
  - **InfluxDB**: Stores all 5Hz MPU6050 samples for detailed analytics
  - **MongoDB**: Receives 10-second aggregated data for dashboard display

- **Intelligent Aggregation**:
  - Calculates vibration magnitude (RMS)
  - Computes tilt angle from accelerometer
  - Detects movement patterns
  - Averages gyroscope readings

- **Activity Classification**:
  - Backend automatically classifies forklift state: PARKED, IDLE, DRIVING, WORKING, CHARGING
  - Uses sensor fusion (accelerometer + ultrasonic + RFID)

## Files

| File | Purpose |
|------|---------|
| `forklift_sensor.ino` | ESP32 Arduino sketch for MPU6050 data collection |
| `mqtt_bridge.py` | **NEW**: Dual-destination bridge (replaces `mqtt_to_influx.py`) |
| `mqtt_to_influx.py` | Original single-destination bridge (kept for reference) |
| `requirements.txt` | Python dependencies |
| `env.template` | Environment configuration template |
| `setup.sh` | Quick setup script for Ubuntu |
| `INFRASTRUCTURE_SETUP.md` | Detailed setup guide for MQTT + InfluxDB |

## Quick Start

### 1. Prerequisites

- Ubuntu 22.04+ (for MQTT broker and InfluxDB)
- Python 3.10+
- ESP32 DevKit with MPU6050
- Node.js backend running on port 3001

### 2. Install MQTT Broker (Mosquitto)

```bash
sudo apt update
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### 3. Install InfluxDB 2.x

```bash
wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
sudo dpkg -i influxdb2-2.7.1-amd64.deb
sudo systemctl start influxdb
sudo systemctl enable influxdb
```

Setup InfluxDB:
```bash
influx setup \
  --org HAMK \
  --bucket forklift_data \
  --username admin \
  --password YourPassword123! \
  --force
```

Save the API token from the output.

### 4. Configure Python Bridge

```bash
cd hardware
cp env.template .env
nano .env
```

Update `.env` with your settings:
```bash
MQTT_BROKER=localhost
INFLUX_TOKEN=your_influxdb_token_here
BACKEND_URL=http://localhost:3001/api/telemetry  # Your Node.js backend
AGGREGATE_INTERVAL=10
```

### 5. Install Python Dependencies

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 6. Run the Bridge

```bash
# Load environment variables
export $(cat .env | xargs)  # On Windows: use a .env loader or set manually

# Run the dual-database bridge
python mqtt_bridge.py
```

### 7. Configure ESP32

Update `forklift_sensor.ino` with your credentials:

```cpp
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* MQTT_SERVER   = "192.168.x.x";  // Your server IP
const char* FORKLIFT_ID   = "forklift_1";
```

### 8. Hardware Wiring

```
ESP32          MPU6050
─────          ───────
3.3V    ────── VCC
GND     ────── GND
GPIO21  ────── SDA
GPIO22  ────── SCL
```

### 9. Upload and Test

1. Open `forklift_sensor.ino` in Arduino IDE
2. Install libraries: PubSubClient, MPU6050 (Electronic Cats)
3. Upload to ESP32
4. Open Serial Monitor (115200 baud)
5. Verify MQTT connection

## Data Flow

1. **ESP32** reads MPU6050 at 5Hz, publishes JSON to MQTT:
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

2. **Python Bridge** receives MQTT message:
   - Writes raw data to **InfluxDB** (all samples)
   - Buffers samples for aggregation
   - Every 10 seconds, calculates:
     - Average accelerometer/gyroscope values
     - Vibration magnitude (RMS)
     - Tilt angle
     - Movement detection
   - POSTs aggregated data to **MongoDB** via backend API

3. **Node.js Backend** receives aggregated data:
   - Enriches with activity classification
   - Stores in MongoDB Telemetry collection
   - Updates Forklift current status

4. **Frontend Dashboard** displays:
   - Real-time forklift state
   - Activity classification
   - Vibration levels
   - Tilt angle warnings

## Monitoring

### Check MQTT messages

```bash
mosquitto_sub -h localhost -t "forklift/mpu6050" -v
```

### Query InfluxDB

```bash
influx query '
from(bucket: "forklift_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "mpu6050")
  |> limit(n: 10)
' --org HAMK
```

### Query MongoDB (via API)

```bash
curl http://localhost:3001/api/telemetry/forklift_1/latest
```

## Activity Classification

The system automatically classifies forklift activity using sensor fusion:

| State | Criteria |
|-------|----------|
| **CHARGING** | RFID detected at charging station |
| **WORKING** | Fork raised OR load detected |
| **DRIVING** | Vibration > 0.15g AND movement detected |
| **IDLE** | Vibration 0.05-0.15g (engine on, not moving) |
| **PARKED** | Vibration < 0.05g AND no movement |
| **UNKNOWN** | Insufficient sensor data |

Classification logic: `backend/src/utils/activityClassifier.js`

## Production Deployment

### Run as Systemd Service

Create `/etc/systemd/system/forklift-bridge.service`:

```ini
[Unit]
Description=Stera Forklift MQTT Bridge
After=network.target mosquitto.service influxdb.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/hardware
EnvironmentFile=/path/to/hardware/.env
ExecStart=/path/to/hardware/venv/bin/python mqtt_bridge.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable forklift-bridge
sudo systemctl start forklift-bridge
sudo systemctl status forklift-bridge
```

## Troubleshooting

### MQTT Connection Failed
```bash
# Check if Mosquitto is running
sudo systemctl status mosquitto

# Test MQTT locally
mosquitto_pub -h localhost -t "test" -m "hello"
mosquitto_sub -h localhost -t "test"
```

### InfluxDB Write Errors
- Verify token has write permissions in InfluxDB UI
- Check bucket name matches exactly: `forklift_data`
- Ensure InfluxDB service is running

### Backend Connection Failed
- Verify Node.js backend is running: `curl http://localhost:3001/health`
- Check BACKEND_URL in `.env` is correct
- Ensure firewall allows port 3001

### ESP32 Not Connecting
- Verify WiFi credentials
- Check MQTT_SERVER IP address (use `ifconfig` or `ipconfig`)
- Ensure ESP32 and server on same network
- Check serial monitor for error messages

## Next Steps

- [ ] Set up Grafana for InfluxDB visualization
- [ ] Add multiple forklift support
- [ ] Implement alerting for abnormal vibration
- [ ] Add GPS/UWB positioning integration
- [ ] Integrate RFID and ultrasonic sensors
- [ ] Set up TLS for MQTT (production)

## Support

See `INFRASTRUCTURE_SETUP.md` for detailed setup instructions.

For issues with the React dashboard, check the main project README.
