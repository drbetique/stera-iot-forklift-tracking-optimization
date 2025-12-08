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
