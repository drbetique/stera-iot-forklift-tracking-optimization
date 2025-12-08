import json
import math
import os
import time
from datetime import datetime, timezone
from collections import deque

import paho.mqtt.client as mqtt
import requests
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

##############################
# CONFIGURATION
##############################

# MQTT Settings
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "forklift/mpu6050")

# InfluxDB Settings (High-frequency time-series data)
INFLUX_URL = os.getenv("INFLUX_URL", "http://127.0.0.1:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "YOUR_TOKEN_HERE")
INFLUX_ORG = os.getenv("INFLUX_ORG", "HAMK")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "forklift_data")

# MongoDB Backend Settings (Aggregated telemetry)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001/api/telemetry")

# Aggregation Settings
AGGREGATE_INTERVAL = int(os.getenv("AGGREGATE_INTERVAL", 10))  # seconds
AGGREGATE_SAMPLE_SIZE = int(os.getenv("AGGREGATE_SAMPLE_SIZE", 50))  # samples

# Forklift Identification
FORKLIFT_ID = os.getenv("FORKLIFT_ID", "forklift_1")

##############################
# INFLUXDB CLIENT
##############################

influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

##############################
# DATA AGGREGATION BUFFER
##############################

class SensorAggregator:
    """Aggregates high-frequency sensor data for MongoDB."""

    def __init__(self, max_samples=50):
        self.max_samples = max_samples
        self.samples = {
            'accel_x': deque(maxlen=max_samples),
            'accel_y': deque(maxlen=max_samples),
            'accel_z': deque(maxlen=max_samples),
            'gyro_x': deque(maxlen=max_samples),
            'gyro_y': deque(maxlen=max_samples),
            'gyro_z': deque(maxlen=max_samples),
            'accel_total': deque(maxlen=max_samples),
        }
        self.last_aggregate_time = time.time()

    def add_sample(self, data):
        """Add a sensor reading to the buffer."""
        self.samples['accel_x'].append(data['accel_x'])
        self.samples['accel_y'].append(data['accel_y'])
        self.samples['accel_z'].append(data['accel_z'])
        self.samples['gyro_x'].append(data['gyro_x'])
        self.samples['gyro_y'].append(data['gyro_y'])
        self.samples['gyro_z'].append(data['gyro_z'])
        self.samples['accel_total'].append(data['accel_total_g'])

    def calculate_aggregates(self):
        """Calculate statistics for MongoDB telemetry."""
        if len(self.samples['accel_x']) == 0:
            return None

        # Calculate vibration magnitude (RMS of total acceleration)
        accel_values = list(self.samples['accel_total'])
        vibration = math.sqrt(sum(a**2 for a in accel_values) / len(accel_values))

        # Calculate tilt angle from average accelerometer values
        avg_ax = sum(self.samples['accel_x']) / len(self.samples['accel_x'])
        avg_ay = sum(self.samples['accel_y']) / len(self.samples['accel_y'])
        avg_az = sum(self.samples['accel_z']) / len(self.samples['accel_z'])

        # Tilt angle relative to gravity (assuming Z is up)
        tilt_angle = math.degrees(math.acos(avg_az / math.sqrt(avg_ax**2 + avg_ay**2 + avg_az**2)))

        # Movement detection based on vibration threshold
        movement_detected = vibration > 0.1  # g-force threshold

        return {
            'accelX': round(avg_ax, 4),
            'accelY': round(avg_ay, 4),
            'accelZ': round(avg_az, 4),
            'gyroX': round(sum(self.samples['gyro_x']) / len(self.samples['gyro_x']), 4),
            'gyroY': round(sum(self.samples['gyro_y']) / len(self.samples['gyro_y']), 4),
            'gyroZ': round(sum(self.samples['gyro_z']) / len(self.samples['gyro_z']), 4),
            'vibrationMagnitude': round(vibration, 4),
            'tiltAngle': round(tilt_angle, 2),
            'movementDetected': movement_detected
        }

    def should_aggregate(self):
        """Check if it's time to send aggregated data to MongoDB."""
        return (time.time() - self.last_aggregate_time) >= AGGREGATE_INTERVAL

    def reset(self):
        """Reset aggregation timer."""
        self.last_aggregate_time = time.time()

# Initialize aggregator
aggregator = SensorAggregator(max_samples=AGGREGATE_SAMPLE_SIZE)

##############################
# DATA PROCESSING
##############################

def process_mpu_data(data):
    """Convert raw MPU6050 values and calculate metrics."""
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
    """Store high-frequency data into InfluxDB."""
    try:
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
    except Exception as e:
        print(f"[ERROR] InfluxDB write failed: {e}")


def send_to_mongodb(forklift_id, accelerometer_data):
    """Send aggregated telemetry to MongoDB backend."""
    try:
        # Build telemetry payload matching backend schema
        payload = {
            "forkliftId": forklift_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "gps": {
                "latitude": 0.0,  # Placeholder - will be replaced by actual GPS
                "longitude": 0.0,
                "valid": False
            },
            "accelerometer": accelerometer_data,
            "activity": {
                "state": "UNKNOWN",  # Will be calculated by backend logic
                "inMotion": accelerometer_data['movementDetected']
            }
        }

        response = requests.post(BACKEND_URL, json=payload, timeout=5)

        if response.status_code == 201:
            print(f"[MongoDB] Sent aggregated data for {forklift_id}")
        else:
            print(f"[MongoDB] Error {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] MongoDB backend unreachable: {e}")


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

        # Process sensor data
        processed = process_mpu_data(raw_data)

        # 1. Write to InfluxDB (high-frequency, all samples)
        write_to_influx(processed, forklift_id)

        # 2. Add to aggregation buffer
        aggregator.add_sample(processed)

        # 3. Send aggregated data to MongoDB at intervals
        if aggregator.should_aggregate():
            aggregated = aggregator.calculate_aggregates()
            if aggregated:
                send_to_mongodb(forklift_id, aggregated)
            aggregator.reset()

        # Console output
        print(f"[InfluxDB] {forklift_id}: accel={processed['accel_total_g']:.3f}g", end='')
        if aggregator.should_aggregate():
            print(" | [Aggregated to MongoDB]")
        else:
            print()

    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON: {e}")
    except Exception as e:
        print(f"[ERROR] Processing message: {e}")


##############################
# MAIN
##############################

def main():
    print("=" * 60)
    print("Stera Forklift Dual-Database Bridge")
    print("MQTT → InfluxDB (high-frequency) + MongoDB (aggregated)")
    print("=" * 60)
    print(f"MQTT Broker:     {MQTT_BROKER}:{MQTT_PORT}")
    print(f"MQTT Topic:      {MQTT_TOPIC}")
    print(f"InfluxDB:        {INFLUX_URL}")
    print(f"InfluxDB Bucket: {INFLUX_BUCKET}")
    print(f"MongoDB Backend: {BACKEND_URL}")
    print(f"Aggregation:     Every {AGGREGATE_INTERVAL}s ({AGGREGATE_SAMPLE_SIZE} samples)")
    print("=" * 60)

    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    print("\nConnecting to MQTT broker...")
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    mqtt_client.loop_forever()


if __name__ == "__main__":
    main()
