# STERA IoT Forklift Analytics Service

Real-time data analytics pipeline for forklift sensor data.

## What It Does

This Python service bridges your ESP32 hardware and InfluxDB by:

1. **Subscribing to MQTT messages** from ESP32 devices
2. **Processing MPU6050 sensor data:**
   - Calculates total acceleration magnitude
   - Computes vibration levels (deviation from 1g)
   - Calculates tilt angle from vertical
3. **Storing data in InfluxDB** for time-series analysis
4. **Running real-time analytics** every 60 seconds:
   - Average/max acceleration per forklift
   - Impact event detection (>2.5g = collision/hard braking)
   - Safety monitoring alerts
5. **Generating CSV reports** for offline analysis

## Architecture

```
ESP32 Hardware → MQTT Broker → Python Analytics → InfluxDB → Dashboard
                    ↓
              (forklift/mpu6050)
```

## Installation

### 1. Install Python Dependencies

```bash
cd analytics
pip install -r requirements.txt
```

### 2. Configure MQTT Broker

Update line 14 in `mqtt-analytics.py`:
```python
MQTT_BROKER = "YOUR_MQTT_BROKER_IP"  # e.g., "10.196.135.31" or "localhost"
```

### 3. Verify InfluxDB Config

The script is already configured for your cloud InfluxDB instance:
- URL: `https://eu-central-1-1.aws.cloud2.influxdata.com`
- Org: `HAMK_Stera`
- Bucket: `forklift_data`

## Usage

### Run the Analytics Service

```bash
python mqtt-analytics.py
```

Expected output:
```
============================================================
STERA IoT Forklift Analytics Service
============================================================
MQTT Broker: 10.196.135.31:1883
MQTT Topic: forklift/mpu6050
InfluxDB: https://eu-central-1-1.aws.cloud2.influxdata.com
InfluxDB Org: HAMK_Stera
InfluxDB Bucket: forklift_data
Impact Threshold: 2.5g
Analytics Interval: 60s
============================================================

Connecting to MQTT broker...
✓ Service started. Waiting for messages...
```

## ESP32 MQTT Message Format

Your ESP32 should publish JSON to `forklift/mpu6050`:

```json
{
  "forkliftId": "FL-HAMK-01",
  "accelerometer": {
    "accel_x": 0.15,
    "accel_y": -0.08,
    "accel_z": 9.81,
    "gyro_x": 1.2,
    "gyro_y": -0.5,
    "gyro_z": 0.3
  },
  "gps": {
    "latitude": 60.1695,
    "longitude": 24.9354,
    "speed": 2.5
  },
  "ultrasonic": {
    "frontObstacle": 150,
    "forkHeight": 25
  },
  "activity": {
    "state": "DRIVING",
    "forkState": "DOWN"
  },
  "rfid": {
    "tagId": "04A32BC21F80"
  }
}
```

## Analytics Output

### Console Output (Every 60 seconds)

```
================ REAL-TIME MPU ANALYTICS =================
Window size: 245 samples
forkliftId    samples  avg_g   max_g  impact_events
FL-HAMK-01        120   1.02    1.85              0
FL-HAMK-02        125   1.15    3.12              3
Saved: mpu_analytics_summary.csv
⚠️  IMPACT EVENTS DETECTED - Saved to mpu_impact_events_recent.csv
=========================================================
```

### CSV Files Generated

1. **`mpu_analytics_summary.csv`** - Aggregated stats per forklift
2. **`mpu_impact_events_recent.csv`** - Last 20 high-impact events (>2.5g)

## Configuration Options

Edit `mqtt-analytics.py` to customize:

- **Impact threshold:** `IMPACT_ACCEL_G = 2.5` (line 35)
- **Analytics interval:** `ANALYTICS_INTERVAL_SEC = 60` (line 38)
- **Buffer size:** `MAX_BUFFER = 10000` (line 221)

## Integration with Dashboard

Your React dashboard will automatically query this InfluxDB data via:

```javascript
// Frontend already has this API call:
api.getLatestSensorData(forkliftId)
api.getSensorHistory(forkliftId, options)
api.getSensorStats(forkliftId, window)
```

The SensorMetrics component will display:
- Real-time vibration levels
- Tilt angle indicators
- Movement detection
- Accelerometer/gyroscope readings

## Troubleshooting

### MQTT Connection Failed
- Verify MQTT broker IP and port
- Check firewall rules
- Ensure broker is running (`mosquitto -v`)

### InfluxDB Write Errors
- Verify InfluxDB token is valid
- Check network connectivity to InfluxDB cloud
- Ensure bucket `forklift_data` exists

### No Analytics Output
- Verify ESP32 is publishing to correct topic
- Check JSON message format
- Ensure at least 1 message received before analytics run

## Next Steps

1. **Start MQTT Broker** (if not running):
   ```bash
   mosquitto -v -p 1883
   ```

2. **Run Analytics Service**:
   ```bash
   python mqtt-analytics.py
   ```

3. **Configure ESP32** to publish to MQTT broker

4. **Monitor dashboard** for real-time sensor visualization
