import json
import paho.mqtt.publish as publish

# Test data
test_data = {
    "forklift_id": "forklift_1",
    "accel_x": 0.05,
    "accel_y": -0.02,
    "accel_z": 0.98,
    "gyro_x": 0.15,
    "gyro_y": -0.22,
    "gyro_z": 0.08
}

# Publish to MQTT
publish.single(
    topic="forklift/mpu6050",
    payload=json.dumps(test_data),
    hostname="localhost",
    port=1883
)

print(f"Published test data for {test_data['forklift_id']}")
print(json.dumps(test_data, indent=2))
