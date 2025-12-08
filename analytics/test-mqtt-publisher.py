"""
Simple MQTT Publisher to test the analytics service
Simulates ESP32 sending MPU6050 sensor data
"""
import json
import time
import random
import paho.mqtt.client as mqtt

# MQTT Configuration (must match analytics script)
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "stera/forklift/mpu6050"

def generate_sample_data(forklift_id="FL-HAMK-01", activity="DRIVING"):
    """Generate realistic sample sensor data"""

    # Simulate different activity states
    activity_profiles = {
        "PARKED": {"vibration": 0.05, "speed": 0, "accel_base": 0.1},
        "IDLE": {"vibration": 0.08, "speed": 0, "accel_base": 0.15},
        "DRIVING": {"vibration": 0.25, "speed": 8.5, "accel_base": 0.4},
        "WORKING": {"vibration": 0.35, "speed": 2.0, "accel_base": 0.5},
    }

    profile = activity_profiles.get(activity, activity_profiles["DRIVING"])

    # Generate sensor data
    data = {
        "forkliftId": forklift_id,
        "timestamp": time.time(),

        # MPU6050 Accelerometer data (in g)
        "accelerometer": {
            "accel_x": random.uniform(-profile["accel_base"], profile["accel_base"]),
            "accel_y": random.uniform(-profile["accel_base"], profile["accel_base"]),
            "accel_z": 9.8 + random.uniform(-0.2, 0.2),  # Gravity
            "gyro_x": random.uniform(-5, 5),
            "gyro_y": random.uniform(-5, 5),
            "gyro_z": random.uniform(-5, 5),
            "temperature": random.uniform(22, 25),
            "vibrationMagnitude": profile["vibration"] + random.uniform(-0.02, 0.02),
            "tiltAngle": random.uniform(0, 15),
            "movementDetected": activity in ["DRIVING", "WORKING"]
        },

        # GPS data
        "gps": {
            "latitude": 60.1695 + random.uniform(-0.001, 0.001),
            "longitude": 24.9354 + random.uniform(-0.001, 0.001),
            "altitude": 10 + random.uniform(-2, 2),
            "speed": profile["speed"] + random.uniform(-1, 1),
            "satellites": random.randint(6, 12),
            "valid": True
        },

        # Ultrasonic sensors
        "ultrasonic": {
            "forkHeight": 15 if activity != "WORKING" else random.uniform(80, 150),
            "loadDistance": 150 if activity != "WORKING" else random.uniform(20, 40),
            "frontObstacle": random.uniform(150, 300),
            "rearObstacle": random.uniform(150, 300),
            "loadDetected": activity == "WORKING"
        },

        # Activity state
        "activity": {
            "state": activity,
            "forkState": "RAISED" if activity == "WORKING" else "DOWN",
            "engineOn": activity != "PARKED",
            "inMotion": activity in ["DRIVING", "WORKING"]
        },

        # Optional RFID
        "rfid": {
            "tagDetected": activity == "CHARGING" if "CHARGING" in activity else False,
            "tagId": "04A32BC21F80" if activity == "CHARGING" else None
        }
    }

    return data


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✓ Connected to MQTT broker")
    else:
        print(f"❌ Connection failed with code {rc}")


def main():
    print("=" * 60)
    print("STERA IoT Test MQTT Publisher")
    print("=" * 60)
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {MQTT_TOPIC}")
    print("=" * 60)

    client = mqtt.Client()
    client.on_connect = on_connect

    print("\nConnecting to MQTT broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()

    time.sleep(2)  # Wait for connection

    try:
        print("\n🚀 Publishing test messages (Press Ctrl+C to stop)\n")

        # Simulate different forklifts and activities
        scenarios = [
            ("FL-HAMK-01", "DRIVING"),
            ("FL-HAMK-02", "WORKING"),
            ("FL-HAMK-03", "PARKED"),
            ("FL-HAMK-01", "IDLE"),
        ]

        message_count = 0

        while True:
            for forklift_id, activity in scenarios:
                data = generate_sample_data(forklift_id, activity)
                payload = json.dumps(data, indent=2)

                result = client.publish(MQTT_TOPIC, payload)

                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    message_count += 1
                    print(f"[{message_count}] ✓ Published: {forklift_id} - {activity}")
                else:
                    print(f"[{message_count}] ❌ Failed to publish message")

                time.sleep(2)  # Send every 2 seconds

    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping publisher...")
        client.loop_stop()
        client.disconnect()
        print("✓ Disconnected from broker")
        print(f"📊 Total messages published: {message_count}")


if __name__ == "__main__":
    main()
