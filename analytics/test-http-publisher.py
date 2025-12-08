"""
HTTP Test Publisher for Stera IoT Dashboard
Simulates ESP32 sending telemetry data via HTTP POST to backend API
This populates MongoDB for dashboard visualization
"""
import json
import time
import random
import requests
from datetime import datetime

# Backend API Configuration
API_BASE_URL = "http://localhost:3001/api"
TELEMETRY_ENDPOINT = f"{API_BASE_URL}/telemetry"

def generate_telemetry_data(forklift_id="FL-HAMK-01", activity="DRIVING"):
    """Generate realistic forklift telemetry data"""

    # Activity profiles matching different operational states
    activity_profiles = {
        "PARKED": {"vibration": 0.05, "speed": 0, "accel_base": 0.1, "fork_height": 15},
        "IDLE": {"vibration": 0.08, "speed": 0, "accel_base": 0.15, "fork_height": 15},
        "DRIVING": {"vibration": 0.25, "speed": 8.5, "accel_base": 0.4, "fork_height": 20},
        "WORKING": {"vibration": 0.35, "speed": 2.0, "accel_base": 0.5, "fork_height": 120},
        "CHARGING": {"vibration": 0.03, "speed": 0, "accel_base": 0.05, "fork_height": 10},
    }

    profile = activity_profiles.get(activity, activity_profiles["DRIVING"])

    # Base coordinates for different forklifts (HAMK campus area in Finland)
    base_locations = {
        "FL-HAMK-01": {"lat": 60.1695, "lon": 24.9354},
        "FL-HAMK-02": {"lat": 60.1698, "lon": 24.9360},
        "FL-HAMK-03": {"lat": 60.1692, "lon": 24.9348},
    }

    base_loc = base_locations.get(forklift_id, {"lat": 60.1695, "lon": 24.9354})

    # Generate complete telemetry payload
    telemetry = {
        "forkliftId": forklift_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",

        # GPS Location Data
        "gps": {
            "latitude": base_loc["lat"] + random.uniform(-0.002, 0.002),
            "longitude": base_loc["lon"] + random.uniform(-0.002, 0.002),
            "altitude": 10 + random.uniform(-2, 2),
            "speed": profile["speed"] + random.uniform(-0.5, 0.5),
            "satellites": random.randint(6, 12),
            "valid": True
        },

        # MPU6050 Accelerometer & Gyroscope Data
        "accelerometer": {
            "accel_x": random.uniform(-profile["accel_base"], profile["accel_base"]),
            "accel_y": random.uniform(-profile["accel_base"], profile["accel_base"]),
            "accel_z": 9.8 + random.uniform(-0.2, 0.2),  # Gravity + noise
            "gyro_x": random.uniform(-5, 5),
            "gyro_y": random.uniform(-5, 5),
            "gyro_z": random.uniform(-5, 5),
            "temperature": random.uniform(22, 26),
            "vibrationMagnitude": profile["vibration"] + random.uniform(-0.02, 0.02),
            "tiltAngle": random.uniform(0, 15) if activity != "PARKED" else random.uniform(0, 3),
            "movementDetected": activity in ["DRIVING", "WORKING"]
        },

        # Ultrasonic Sensors (HC-SR04)
        "ultrasonic": {
            "forkHeight": profile["fork_height"] + random.uniform(-5, 5),
            "loadDistance": 150 if activity != "WORKING" else random.uniform(20, 40),
            "frontObstacle": random.uniform(150, 300),
            "rearObstacle": random.uniform(150, 300),
            "loadDetected": activity == "WORKING"
        },

        # Activity State (classified by system)
        "activity": {
            "state": activity,
            "forkState": "RAISED" if activity == "WORKING" else "DOWN",
            "engineOn": activity != "PARKED",
            "inMotion": activity in ["DRIVING", "WORKING"]
        },

        # RFID Station Detection (RC522)
        "rfid": {
            "tagDetected": activity == "CHARGING",
            "tagId": "CHARGE-STATION-01" if activity == "CHARGING" else None,
            "stationName": "Charging Bay 1" if activity == "CHARGING" else None
        },

        # Battery Status (simulated)
        "battery": {
            "level": random.randint(60, 95) if activity != "CHARGING" else random.randint(85, 100),
            "voltage": random.uniform(11.5, 12.6),
            "charging": activity == "CHARGING"
        }
    }

    return telemetry


def send_telemetry(data):
    """Send telemetry data to backend API"""
    try:
        response = requests.post(
            TELEMETRY_ENDPOINT,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )

        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            return True, result
        else:
            return False, f"HTTP {response.status_code}: {response.text}"

    except requests.exceptions.ConnectionError:
        return False, "Connection failed - is backend running?"
    except requests.exceptions.Timeout:
        return False, "Request timeout"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 70)
    print("STERA IoT HTTP Test Publisher")
    print("=" * 70)
    print(f"Backend API: {API_BASE_URL}")
    print(f"Endpoint: {TELEMETRY_ENDPOINT}")
    print("=" * 70)

    # Test scenarios simulating different forklift activities
    scenarios = [
        ("FL-HAMK-01", "DRIVING"),
        ("FL-HAMK-02", "WORKING"),
        ("FL-HAMK-03", "IDLE"),
        ("FL-HAMK-01", "WORKING"),
        ("FL-HAMK-02", "DRIVING"),
        ("FL-HAMK-03", "PARKED"),
    ]

    print("\n🔍 Testing backend connection...")
    test_data = generate_telemetry_data("FL-TEST-00", "IDLE")
    success, result = send_telemetry(test_data)

    if not success:
        print(f"❌ Backend connection failed: {result}")
        print("\nPlease ensure:")
        print("  1. Backend is running: cd backend && npm run dev")
        print("  2. Backend is accessible at http://localhost:3001")
        return

    print("✅ Backend connection successful!\n")

    try:
        print("🚀 Publishing telemetry data (Press Ctrl+C to stop)\n")

        message_count = 0
        cycle_count = 0

        while True:
            cycle_count += 1
            print(f"\n--- Cycle {cycle_count} ---")

            for forklift_id, activity in scenarios:
                data = generate_telemetry_data(forklift_id, activity)
                success, result = send_telemetry(data)

                if success:
                    message_count += 1
                    print(f"[{message_count:3d}] ✅ {forklift_id:12s} | {activity:10s} | "
                          f"GPS: ({data['gps']['latitude']:.4f}, {data['gps']['longitude']:.4f}) | "
                          f"Battery: {data['battery']['level']}%")
                else:
                    print(f"[{message_count:3d}] ❌ {forklift_id:12s} | Failed: {result}")

                time.sleep(1)  # Send every 1 second

            print(f"\n📊 Total messages sent: {message_count}")
            time.sleep(3)  # Pause between cycles

    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping publisher...")
        print(f"✅ Total messages published: {message_count}")
        print(f"📦 Completed {cycle_count} cycles")


if __name__ == "__main__":
    main()
