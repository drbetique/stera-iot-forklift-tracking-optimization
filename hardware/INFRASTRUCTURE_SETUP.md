# Stera Forklift IoT Infrastructure Setup Guide

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ESP32 + MPU6050│────▶│  MQTT Broker    │────▶│  Python Script  │────▶│  InfluxDB       │
│  (Sensor Node)  │     │  (Mosquitto)    │     │  (Subscriber)   │     │  (Time-Series)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
    5 Hz JSON              Port 1883              Processes &              Stores with
    via WiFi               TCP/IP                 Calculates               Timestamps
```

## Prerequisites

- Ubuntu 22.04 or newer (server or desktop)
- Python 3.10+
- Network access between all components
- ESP32 DevKit with MPU6050 sensor

---

## Part 1: MQTT Broker (Mosquitto)

### 1.1 Install Mosquitto

```bash
sudo apt update
sudo apt install -y mosquitto mosquitto-clients
```

### 1.2 Configure Mosquitto

Create configuration file:

```bash
sudo nano /etc/mosquitto/conf.d/forklift.conf
```

Add these lines:

```
listener 1883
allow_anonymous true
```

Note: For production, enable authentication. This config is for development only.

### 1.3 Start and Enable Service

```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
sudo systemctl status mosquitto
```

### 1.4 Test MQTT Broker

Open two terminal windows.

Terminal 1 (subscriber):
```bash
mosquitto_sub -h localhost -t "forklift/mpu6050" -v
```

Terminal 2 (publisher):
```bash
mosquitto_pub -h localhost -t "forklift/mpu6050" -m '{"test":"hello"}'
```

You should see the message appear in Terminal 1.

### 1.5 Firewall Configuration

```bash
sudo ufw allow 1883/tcp
sudo ufw status
```

---

## Part 2: InfluxDB Setup

### 2.1 Install InfluxDB 2.x

```bash
wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
sudo dpkg -i influxdb2-2.7.1-amd64.deb
```

### 2.2 Start InfluxDB Service

```bash
sudo systemctl start influxdb
sudo systemctl enable influxdb
sudo systemctl status influxdb
```

### 2.3 Initial Setup via CLI

```bash
influx setup \
  --org HAMK \
  --bucket forklift_data \
  --username admin \
  --password YourSecurePassword123! \
  --force
```

Save the output. It contains your API token.

### 2.4 Alternative: Web UI Setup

1. Open browser: http://localhost:8086
2. Create account with:
   - Organization: HAMK
   - Bucket: forklift_data
3. Navigate to: Data > API Tokens
4. Generate new token with write access to forklift_data bucket
5. Copy and save the token securely

### 2.5 Verify Installation

```bash
influx bucket list --org HAMK
```

You should see "forklift_data" in the output.

---

## Part 3: Python Environment

### 3.1 Create Virtual Environment

```bash
cd ~
mkdir stera-forklift
cd stera-forklift
python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Dependencies

```bash
pip install paho-mqtt influxdb-client
```

### 3.3 Create Updated Python Script

Create file: `mqtt_to_influx.py`

```python
import json
import math
import os
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

##############################
# CONFIGURATION
##############################

# MQTT Settings
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "forklift/mpu6050")

# InfluxDB Settings
INFLUX_URL = os.getenv("INFLUX_URL", "http://127.0.0.1:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "YOUR_TOKEN_HERE")
INFLUX_ORG = os.getenv("INFLUX_ORG", "HAMK")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "forklift_data")

# Forklift Identification
FORKLIFT_ID = os.getenv("FORKLIFT_ID", "forklift_1")

##############################
# INFLUXDB CLIENT
##############################

influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)


def process_mpu_data(data):
    """Convert raw MPU6050 values and calculate total acceleration."""
    ax = float(data.get("accel_x", 0))
    ay = float(data.get("accel_y", 0))
    az = float(data.get("accel_z", 0))

    accel_total = math.sqrt(ax * ax + ay * ay + az * az)

    return {
        "accel_x": ax,
        "accel_y": ay,
        "accel_z": az,
        "gyro_x": float(data.get("gyro_x", 0)),
        "gyro_y": float(data.get("gyro_y", 0)),
        "gyro_z": float(data.get("gyro_z", 0)),
        "accel_total_g": accel_total,
    }


def write_to_influx(processed, forklift_id):
    """Store processed data into InfluxDB."""
    point = (
        Point("mpu6050")
        .tag("source", forklift_id)
        .field("accel_x", processed["accel_x"])
        .field("accel_y", processed["accel_y"])
        .field("accel_z", processed["accel_z"])
        .field("gyro_x", processed["gyro_x"])
        .field("gyro_y", processed["gyro_y"])
        .field("gyro_z", processed["gyro_z"])
        .field("accel_total_g", processed["accel_total_g"])
        .time(datetime.now(timezone.utc), WritePrecision.NS)
    )
    write_api.write(bucket=INFLUX_BUCKET, record=point)


##############################
# MQTT CALLBACKS
##############################

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[OK] Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        print(f"[OK] Subscribing to topic: {MQTT_TOPIC}")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"[ERROR] MQTT connection failed with code: {rc}")


def on_message(client, userdata, msg):
    """Process incoming MQTT messages."""
    try:
        payload_str = msg.payload.decode("utf-8")
        raw_data = json.loads(payload_str)
        
        # Extract forklift_id from payload or use default
        forklift_id = raw_data.get("forklift_id", FORKLIFT_ID)
        
        processed = process_mpu_data(raw_data)
        write_to_influx(processed, forklift_id)
        
        print(f"[OK] {forklift_id}: accel_total={processed['accel_total_g']:.3f}g")

    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON: {e}")
    except Exception as e:
        print(f"[ERROR] Processing message: {e}")


##############################
# MAIN
##############################

def main():
    print("=" * 50)
    print("Stera Forklift MQTT to InfluxDB Bridge")
    print("=" * 50)
    print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"MQTT Topic:  {MQTT_TOPIC}")
    print(f"InfluxDB:    {INFLUX_URL}")
    print(f"Bucket:      {INFLUX_BUCKET}")
    print("=" * 50)

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    print("Connecting to MQTT broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_forever()


if __name__ == "__main__":
    main()
```

### 3.4 Create Environment File

Create file: `.env`

```bash
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC=forklift/mpu6050
INFLUX_URL=http://127.0.0.1:8086
INFLUX_TOKEN=your_actual_token_here
INFLUX_ORG=HAMK
INFLUX_BUCKET=forklift_data
FORKLIFT_ID=forklift_1
```

### 3.5 Run the Script

```bash
# Load environment variables
export $(cat .env | xargs)

# Run script
python mqtt_to_influx.py
```

---

## Part 4: ESP32 Arduino Setup

### 4.1 Install Arduino IDE Libraries

In Arduino IDE, go to: Sketch > Include Library > Manage Libraries

Install:
- PubSubClient (by Nick O'Leary)
- MPU6050 (by Electronic Cats)
- Wire (built-in)

### 4.2 Update ESP32 Code

Modify the .ino file with your credentials:

```cpp
// Line 8-9: Update WiFi credentials
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// Line 11: Update MQTT server IP
const char* MQTT_SERVER   = "192.168.x.x";  // Your server IP
```

### 4.3 Hardware Wiring

```
ESP32          MPU6050
─────          ───────
3.3V    ────── VCC
GND     ────── GND
GPIO21  ────── SDA
GPIO22  ────── SCL
```

### 4.4 Upload and Test

1. Connect ESP32 via USB
2. Select board: ESP32 Dev Module
3. Select correct COM port
4. Upload sketch
5. Open Serial Monitor at 115200 baud
6. Verify "WiFi connected" and "MQTT connected" messages

---

## Part 5: Verification

### 5.1 Test Complete Pipeline

1. Start InfluxDB (should be running as service)
2. Start MQTT broker (should be running as service)
3. Start Python script in terminal
4. Power on ESP32
5. Watch Python terminal for incoming data

### 5.2 Query InfluxDB Data

```bash
influx query '
from(bucket: "forklift_data")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "mpu6050")
  |> limit(n: 10)
' --org HAMK
```

### 5.3 Check Data in Web UI

1. Open http://localhost:8086
2. Navigate to: Data Explorer
3. Select bucket: forklift_data
4. Select measurement: mpu6050
5. View real-time data

---

## Part 6: Systemd Service (Production)

### 6.1 Create Service File

```bash
sudo nano /etc/systemd/system/forklift-mqtt.service
```

Add:

```ini
[Unit]
Description=Stera Forklift MQTT to InfluxDB Bridge
After=network.target mosquitto.service influxdb.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/home/your_username/stera-forklift
Environment="MQTT_BROKER=localhost"
Environment="INFLUX_TOKEN=your_token"
ExecStart=/home/your_username/stera-forklift/venv/bin/python mqtt_to_influx.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 6.2 Enable Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable forklift-mqtt
sudo systemctl start forklift-mqtt
sudo systemctl status forklift-mqtt
```

---

## Troubleshooting

### MQTT Connection Failed
- Check if Mosquitto is running: `sudo systemctl status mosquitto`
- Verify port 1883 is open: `sudo netstat -tlnp | grep 1883`
- Test with mosquitto_sub locally first

### InfluxDB Write Errors
- Verify token has write permissions
- Check bucket name matches exactly
- Ensure InfluxDB service is running

### ESP32 WiFi Issues
- Verify SSID and password are correct
- Check if router allows new connections
- Ensure ESP32 is within WiFi range

### No Data in InfluxDB
- Check Python script output for errors
- Verify MQTT topic matches in both Arduino and Python
- Test MQTT with mosquitto_pub manually

---

## Next Steps

1. Set up Grafana for visualization (connects to InfluxDB)
2. Integrate with existing MongoDB dashboard
3. Add multiple forklift support
4. Implement alerting for abnormal acceleration events
