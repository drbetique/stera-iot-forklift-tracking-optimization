import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

##############################
# CONFIGURATION
##############################

# MQTT Settings
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "forklift/mpu6050")

# InfluxDB Cloud v2 Settings
INFLUX_URL = os.getenv("INFLUX_HOST", "http://127.0.0.1:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "")
INFLUX_ORG = os.getenv("INFLUX_ORG", "HAMK")
INFLUX_BUCKET = os.getenv("INFLUX_DATABASE", "forklift_data")

# Forklift Identification
FORKLIFT_ID = os.getenv("FORKLIFT_ID", "forklift_1")

##############################
# INFLUXDB V2 CLIENT
##############################

try:
    influx_client = InfluxDBClient(
        url=INFLUX_URL,
        token=INFLUX_TOKEN,
        org=INFLUX_ORG
    )
    write_api = influx_client.write_api(write_options=SYNCHRONOUS)
    print(f"[OK] InfluxDB v2 client initialized")
except Exception as e:
    print(f"[ERROR] InfluxDB initialization failed: {e}")
    print("Please configure InfluxDB credentials in .env file")
    exit(1)

##############################
# DATA PROCESSING
##############################

def process_mpu_data(data):
    """Convert raw MPU6050 values and calculate metrics."""
    ax = float(data.get("accel_x", 0))
    ay = float(data.get("accel_y", 0))
    az = float(data.get("accel_z", 0))

    # Calculate total acceleration magnitude
    accel_total = math.sqrt(ax * ax + ay * ay + az * az)

    # Calculate vibration magnitude (deviation from 1g)
    vibration = abs(accel_total - 1.0)

    # Calculate tilt angle (degrees from vertical)
    try:
        tilt_angle = math.degrees(math.acos(az / accel_total))
    except (ValueError, ZeroDivisionError):
        tilt_angle = 0.0

    return {
        "accel_x": ax,
        "accel_y": ay,
        "accel_z": az,
        "gyro_x": float(data.get("gyro_x", 0)),
        "gyro_y": float(data.get("gyro_y", 0)),
        "gyro_z": float(data.get("gyro_z", 0)),
        "accel_total_g": accel_total,
        "vibration_g": vibration,
        "tilt_angle": tilt_angle
    }


def write_to_influx(processed, forklift_id):
    """Store sensor data into InfluxDB v2."""
    try:
        # Create point for InfluxDB v2
        point = Point("mpu6050") \
            .tag("forklift_id", forklift_id) \
            .field("accel_x", processed["accel_x"]) \
            .field("accel_y", processed["accel_y"]) \
            .field("accel_z", processed["accel_z"]) \
            .field("gyro_x", processed["gyro_x"]) \
            .field("gyro_y", processed["gyro_y"]) \
            .field("gyro_z", processed["gyro_z"]) \
            .field("accel_total_g", processed["accel_total_g"]) \
            .field("vibration_g", processed["vibration_g"]) \
            .field("tilt_angle", processed["tilt_angle"]) \
            .time(datetime.now(timezone.utc), WritePrecision.NS)

        # Write to InfluxDB v2
        write_api.write(bucket=INFLUX_BUCKET, record=point)
        return True
    except Exception as e:
        print(f"[ERROR] InfluxDB write failed: {e}")
        return False


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

        # Write to InfluxDB
        success = write_to_influx(processed, forklift_id)

        if success:
            # Console output
            print(f"✓ [{forklift_id}] "
                  f"accel={processed['accel_total_g']:.3f}g "
                  f"vib={processed['vibration_g']:.3f}g "
                  f"tilt={processed['tilt_angle']:.1f}°")

    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON: {e}")
    except Exception as e:
        print(f"[ERROR] Processing message: {e}")


##############################
# MAIN
##############################

def main():
    print("=" * 60)
    print("Stera Forklift MQTT → InfluxDB Cloud Bridge")
    print("=" * 60)
    print(f"MQTT Broker:     {MQTT_BROKER}:{MQTT_PORT}")
    print(f"MQTT Topic:      {MQTT_TOPIC}")
    print(f"InfluxDB Cloud:  {INFLUX_URL}")
    print(f"InfluxDB Bucket: {INFLUX_BUCKET}")
    print(f"InfluxDB Org:    {INFLUX_ORG}")
    print("=" * 60)

    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    print("\nConnecting to MQTT broker...")
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        mqtt_client.loop_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down gracefully...")
        mqtt_client.disconnect()
        influx_client.close()
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()
