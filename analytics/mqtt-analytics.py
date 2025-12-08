import json
import math
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import requests
import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

##############################
# MQTT CONFIG
##############################
# Using public test broker for now (test.mosquitto.org)
# To use local broker, change to "localhost" after installing Mosquitto
# To use school/lab broker, change to "10.196.135.31"
MQTT_BROKER = "test.mosquitto.org"  # Public test MQTT broker
MQTT_PORT   = 1883
MQTT_TOPIC  = "stera/forklift/mpu6050"  # Unique topic for your project

##############################
# INFLUXDB CONFIG
##############################
INFLUX_URL    = "https://eu-central-1-1.aws.cloud2.influxdata.com"  # Updated to match your cloud instance
INFLUX_TOKEN  = "HXsNmhVRBFRYo1GmphPjD19uJCsprBGLzjibdOgC_eb35qQqrxFnMSkb2EFKhi7j2gZHscE89OoV4Ds26rSXaQ=="
INFLUX_ORG    = "HAMK_Stera"
INFLUX_BUCKET = "forklift_data"

# Create InfluxDB client + synchronous write (no warnings)
influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

##############################
# ANALYTICS CONFIG
##############################
# Impact threshold (g) – tune this based on real data
IMPACT_ACCEL_G = 2.5

# How often to run analytics (seconds)
ANALYTICS_INTERVAL_SEC = 60

# Backend API for pushing analytics
BACKEND_API_URL = "http://localhost:3001/api/analytics"

# In-memory buffer for analytics
ANALYTICS_BUFFER = []
LAST_ANALYTICS_RUN = 0.0
ANALYTICS_START_TIME = None


##############################
# HELPERS
##############################
def to_float_or_nan(value):
    if value is None:
        return np.nan
    try:
        return float(value)
    except Exception:
        return np.nan


##############################
# ORIGINAL PROCESSING (FROM YOUR FILE)
##############################
def process_mpu_data(data):
    """Convert raw MPU6050 values and add accel_total."""
    ax = float(data.get("accel_x", 0))
    ay = float(data.get("accel_y", 0))
    az = float(data.get("accel_z", 0))

    accel_total = math.sqrt(ax*ax + ay*ay + az*az)

    # Calculate vibration magnitude (deviation from 1g rest state)
    vibration_g = abs(accel_total - 1.0)

    # Calculate tilt angle (degrees from vertical)
    tilt_angle = math.degrees(math.acos(min(1.0, abs(az) / max(0.01, accel_total))))

    return {
        "accel_x": ax,
        "accel_y": ay,
        "accel_z": az,
        "gyro_x": float(data.get("gyro_x", 0)),
        "gyro_y": float(data.get("gyro_y", 0)),
        "gyro_z": float(data.get("gyro_z", 0)),
        "accel_total_g": accel_total,
        "vibration_g": vibration_g,
        "tilt_angle": tilt_angle
    }


def write_to_influx(forklift_id, processed):
    """Store processed data into InfluxDB."""
    point = (
        Point("mpu6050")
        .tag("forklift_id", forklift_id)
        .field("accel_x", processed["accel_x"])
        .field("accel_y", processed["accel_y"])
        .field("accel_z", processed["accel_z"])
        .field("gyro_x", processed["gyro_x"])
        .field("gyro_y", processed["gyro_y"])
        .field("gyro_z", processed["gyro_z"])
        .field("accel_total_g", processed["accel_total_g"])
        .field("vibration_g", processed["vibration_g"])
        .field("tilt_angle", processed["tilt_angle"])
        .time(datetime.now(timezone.utc), WritePrecision.NS)
    )
    write_api.write(bucket=INFLUX_BUCKET, record=point)


##############################
# ANALYTICS ROW BUILDER
##############################
def build_analysis_row(raw_data, processed):
    """
    Build a flat dict for analytics.

    This supports more fields than we currently store in Influx.
    If you later add extra keys (speed, obstacleDistance, etc.)
    in the Arduino JSON, they will automatically appear here.
    """
    now = datetime.now(timezone.utc)

    # Optional GPS/location from the payload, if you add it later
    gps = raw_data.get("gps") or {}
    lat = gps.get("latitude")
    lon = gps.get("longitude")

    row = {
        "timestamp": now,
        "forkliftId": raw_data.get("forkliftId", "forklift_1"),

        # Optional higher-level telemetry (if present in payload)
        "speed": to_float_or_nan(gps.get("speed")),
        "obstacleDistance": to_float_or_nan(raw_data.get("ultrasonic", {}).get("frontObstacle")),
        "currentActivity": raw_data.get("activity", {}).get("state"),
        "rfidTagId": raw_data.get("rfid", {}).get("tagId"),
        "forkHeight": to_float_or_nan(raw_data.get("ultrasonic", {}).get("forkHeight")),
        "forkStatus": raw_data.get("activity", {}).get("forkState"),

        # Location (optional)
        "lon": to_float_or_nan(lon),
        "lat": to_float_or_nan(lat),

        # MPU values
        "accel_x": processed["accel_x"],
        "accel_y": processed["accel_y"],
        "accel_z": processed["accel_z"],
        "gyro_x": processed["gyro_x"],
        "gyro_y": processed["gyro_y"],
        "gyro_z": processed["gyro_z"],
        "accel_total_g": processed["accel_total_g"],
        "vibration_g": processed["vibration_g"],
        "tilt_angle": processed["tilt_angle"],
    }
    return row


##############################
# ANALYTICS FUNCTIONS
##############################
def push_to_mongodb(analytics_data):
    """Push analytics data to MongoDB via backend API."""
    try:
        response = requests.post(
            BACKEND_API_URL,
            json=analytics_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )

        if response.status_code in [200, 201]:
            print(f"✅ Analytics pushed to MongoDB successfully")
            return True
        else:
            print(f"❌ Failed to push analytics: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error pushing to MongoDB: {e}")
        return False


def determine_severity(accel_g):
    """Determine impact severity based on acceleration."""
    if accel_g >= 15.0:
        return "critical"
    elif accel_g >= 10.0:
        return "high"
    elif accel_g >= 5.0:
        return "medium"
    else:
        return "low"


def run_analytics_if_needed():
    """
    Periodically run analytics on the in-memory buffer.
    Pushes results to MongoDB and saves CSV backups.
    """
    global LAST_ANALYTICS_RUN, ANALYTICS_BUFFER, ANALYTICS_START_TIME

    now = time.time()
    if now - LAST_ANALYTICS_RUN < ANALYTICS_INTERVAL_SEC:
        return

    LAST_ANALYTICS_RUN = now

    if ANALYTICS_START_TIME is None:
        ANALYTICS_START_TIME = datetime.now(timezone.utc)

    if not ANALYTICS_BUFFER:
        print("\n[Analytics] No data in buffer yet.")
        return

    analytics_start_processing = time.time()

    df = pd.DataFrame(ANALYTICS_BUFFER)

    # Make sure we have timestamps
    df = df.dropna(subset=["timestamp"])
    if df.empty:
        print("\n[Analytics] Buffer has no valid timestamps.")
        return

    # Sort by forklift and time
    df = df.sort_values(["forkliftId", "timestamp"])

    # Basic stats by forklift
    stats = (
        df.groupby("forkliftId")["accel_total_g"]
        .agg(["count", "mean", "max"])
        .reset_index()
        .rename(columns={"count": "samples", "mean": "avg_g", "max": "max_g"})
    )

    # Impact events: samples where total acceleration is high
    impacts = df[df["accel_total_g"] >= IMPACT_ACCEL_G]
    impact_counts = (
        impacts.groupby("forkliftId")
        .size()
        .reset_index(name="impact_events")
        if not impacts.empty else pd.DataFrame(columns=["forkliftId", "impact_events"])
    )

    # Merge
    summary = stats.merge(impact_counts, on="forkliftId", how="left")
    summary["impact_events"] = summary["impact_events"].fillna(0).astype(int)

    # Print a short summary
    print("\n================ REAL-TIME MPU ANALYTICS =================")
    print(f"Window size: {len(df)} samples")
    print(summary.to_string(index=False))

    # Prepare analytics data for MongoDB
    window_end = datetime.now(timezone.utc)
    window_start = ANALYTICS_START_TIME

    # Build by-forklift summary
    by_forklift = []
    for _, row in summary.iterrows():
        by_forklift.append({
            "forkliftId": row["forkliftId"],
            "samples": int(row["samples"]),
            "avgAcceleration": float(row["avg_g"]),
            "maxAcceleration": float(row["max_g"]),
            "impactEvents": int(row["impact_events"])
        })

    # Build impact events list
    impact_events = []
    if not impacts.empty:
        for _, impact in impacts.iterrows():
            impact_events.append({
                "timestamp": impact["timestamp"].isoformat() if isinstance(impact["timestamp"], datetime) else str(impact["timestamp"]),
                "forkliftId": impact["forkliftId"],
                "accelTotalG": float(impact["accel_total_g"]),
                "accelX": float(impact["accel_x"]),
                "accelY": float(impact["accel_y"]),
                "accelZ": float(impact["accel_z"]),
                "location": {
                    "latitude": float(impact.get("lat", 0)) if not pd.isna(impact.get("lat")) else None,
                    "longitude": float(impact.get("lon", 0)) if not pd.isna(impact.get("lon")) else None
                },
                "activity": impact.get("currentActivity"),
                "severity": determine_severity(impact["accel_total_g"])
            })

    # Prepare analytics payload
    analytics_data = {
        "type": "fleet_summary",
        "timeWindow": {
            "start": window_start.isoformat(),
            "end": window_end.isoformat(),
            "durationSeconds": int((window_end - window_start).total_seconds())
        },
        "fleetSummary": {
            "totalSamples": int(len(df)),
            "forkliftCount": int(df["forkliftId"].nunique()),
            "averageAcceleration": float(df["accel_total_g"].mean()),
            "maxAcceleration": float(df["accel_total_g"].max()),
            "totalImpactEvents": int(len(impacts)),
            "byForklift": by_forklift
        },
        "impactEvents": impact_events[:20],  # Last 20 impact events
        "metadata": {
            "source": "mqtt_analytics",
            "version": "1.0",
            "processingTimeMs": int((time.time() - analytics_start_processing) * 1000)
        }
    }

    # Push to MongoDB
    push_to_mongodb(analytics_data)

    # Optional: save snapshots as CSV backup
    summary.to_csv("mpu_analytics_summary.csv", index=False)

    if not impacts.empty:
        impacts[[
            "timestamp",
            "forkliftId",
            "accel_total_g",
            "accel_x",
            "accel_y",
            "accel_z",
        ]].tail(20).to_csv("mpu_impact_events_recent.csv", index=False)
        print("⚠️  IMPACT EVENTS DETECTED - Saved to CSV and MongoDB")

    print("Saved: mpu_analytics_summary.csv")
    print("=========================================================\n")

    # Reset the start time for next window
    ANALYTICS_START_TIME = datetime.now(timezone.utc)

    # You can choose whether to keep all history or only a sliding window.
    # Example: keep only the last 10,000 samples to limit memory:
    MAX_BUFFER = 10000
    if len(ANALYTICS_BUFFER) > MAX_BUFFER:
        ANALYTICS_BUFFER = ANALYTICS_BUFFER[-MAX_BUFFER:]


##############################
# MQTT CALLBACKS
##############################
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with code:", rc)
    if rc == 0:
        print("✓ Subscribing to topic:", MQTT_TOPIC)
        client.subscribe(MQTT_TOPIC)
    else:
        print("❌ MQTT Connection failed")


def on_message(client, userdata, msg):
    """Runs every time a message arrives."""
    global ANALYTICS_BUFFER

    try:
        payload_str = msg.payload.decode("utf-8")
        print("\n--- RAW MQTT MESSAGE ---")
        print(payload_str)

        raw_data = json.loads(payload_str)

        forklift_id = raw_data.get("forkliftId", "forklift_1")

        # 1) Your original MPU processing
        processed = process_mpu_data(raw_data.get("accelerometer", {}))

        print("--- PROCESSED DATA BEFORE DB ---")
        print(processed)

        write_to_influx(forklift_id, processed)
        print("✓ Written to InfluxDB")

        # 2) NEW: Append to analytics buffer and run analytics periodically
        row = build_analysis_row(raw_data, processed)
        ANALYTICS_BUFFER.append(row)
        run_analytics_if_needed()

    except Exception as e:
        print("Error handling message:", e)


##############################
# MAIN
##############################
def main():
    print("=" * 60)
    print("STERA IoT Forklift Analytics Service")
    print("=" * 60)
    print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"MQTT Topic: {MQTT_TOPIC}")
    print(f"InfluxDB: {INFLUX_URL}")
    print(f"InfluxDB Org: {INFLUX_ORG}")
    print(f"InfluxDB Bucket: {INFLUX_BUCKET}")
    print(f"Impact Threshold: {IMPACT_ACCEL_G}g")
    print(f"Analytics Interval: {ANALYTICS_INTERVAL_SEC}s")
    print("=" * 60)

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    print("\nConnecting to MQTT broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)

    # Blocking loop, callbacks above will handle messages and analytics
    print("✓ Service started. Waiting for messages...\n")
    client.loop_forever()


if __name__ == "__main__":
    main()
