/*
 * Stera IoT - Forklift Sensor (HTTP Version)
 *
 * ESP32 + MPU6050 sending data directly to backend
 * Simpler setup - no MQTT broker needed!
 *
 * Hardware Setup:
 * ESP32 Pin | MPU6050 Pin
 * ----------|------------
 * 3.3V      | VCC
 * GND       | GND
 * GPIO 21   | SDA
 * GPIO 22   | SCL
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

//==================================================
// CONFIGURATION - UPDATE THESE VALUES!
//==================================================

// WiFi Credentials
const char* WIFI_SSID = "VIB";        // Change this
const char* WIFI_PASSWORD = "victor13"; // Change this

// Backend API URL
// Use local backend for development (computer must be on same WiFi network)
const char* API_URL = "http://10.155.156.244:3001/api/telemetry";

// Production backend (uncomment to send to Render instead):
// const char* API_URL = "https://stera-iot-backend.onrender.com/api/telemetry";

// Forklift Configuration
const char* FORKLIFT_ID = "STR01-NEW-CODE";  // CHANGED TO VERIFY UPLOAD WORKED
const char* FORKLIFT_NAME = "Forklift 1";

//==================================================
// OBJECTS
//==================================================

Adafruit_MPU6050 mpu;
HTTPClient http;

// Timing
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;  // Send every 1 second (1 Hz)

//==================================================
// WIFI SETUP
//==================================================

void setupWiFi() {
  Serial.println("\n========================================");
  Serial.println("    Stera IoT - Forklift Sensor");
  Serial.println("========================================\n");

  // Print which backend URL is configured
  Serial.print("📡 API Endpoint: ");
  Serial.println(API_URL);
  Serial.println();

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✓ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm\n");
  } else {
    Serial.println("\n\n✗ WiFi Connection Failed!");
    Serial.println("Restarting in 5 seconds...\n");
    delay(5000);
    ESP.restart();
  }
}

//==================================================
// MPU6050 SETUP
//==================================================

void setupMPU6050() {
  Serial.println("Initializing MPU6050...");

  if (!mpu.begin()) {
    Serial.println("✗ Failed to find MPU6050 chip!");
    Serial.println("Check wiring:");
    Serial.println("  ESP32 3.3V → MPU6050 VCC");
    Serial.println("  ESP32 GND  → MPU6050 GND");
    Serial.println("  ESP32 D21  → MPU6050 SDA");
    Serial.println("  ESP32 D22  → MPU6050 SCL");
    while (1) {
      delay(1000);
    }
  }

  Serial.println("✓ MPU6050 Found!\n");

  // Configure MPU6050
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 Configuration:");
  Serial.println("  Accelerometer: ±8g");
  Serial.println("  Gyroscope: ±500°/s");
  Serial.println("  Filter: 21 Hz\n");

  delay(100);
}

//==================================================
// SEND DATA TO BACKEND
//==================================================

void sendSensorData() {
  // Read sensor data
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);

  // Calculate vibration magnitude
  float vibration = sqrt(
    accel.acceleration.x * accel.acceleration.x +
    accel.acceleration.y * accel.acceleration.y +
    accel.acceleration.z * accel.acceleration.z
  );

  // Build JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"forkliftId\":\"" + String(FORKLIFT_ID) + "\",";
  jsonPayload += "\"timestamp\":\"" + String(millis()) + "\",";

  // Accelerometer data
  jsonPayload += "\"accelerometer\":{";
  jsonPayload += "\"accelX\":" + String(accel.acceleration.x / 9.81, 3) + ",";
  jsonPayload += "\"accelY\":" + String(accel.acceleration.y / 9.81, 3) + ",";
  jsonPayload += "\"accelZ\":" + String(accel.acceleration.z / 9.81, 3) + ",";
  jsonPayload += "\"gyroX\":" + String(gyro.gyro.x * 57.2958, 2) + ",";
  jsonPayload += "\"gyroY\":" + String(gyro.gyro.y * 57.2958, 2) + ",";
  jsonPayload += "\"gyroZ\":" + String(gyro.gyro.z * 57.2958, 2) + ",";
  jsonPayload += "\"temperature\":" + String(temp.temperature, 1) + ",";
  jsonPayload += "\"vibrationMagnitude\":" + String(vibration / 9.81, 3);
  jsonPayload += "},";

  // GPS (placeholder - add real GPS module if you have one)
  jsonPayload += "\"gps\":{";
  jsonPayload += "\"latitude\":60.1695,";
  jsonPayload += "\"longitude\":24.9354,";
  jsonPayload += "\"valid\":false";
  jsonPayload += "},";

  // Activity classification (simple threshold-based)
  String activity = "UNKNOWN";
  if (vibration < 1.0) {
    activity = "PARKED";
  } else if (vibration < 2.0) {
    activity = "IDLE";
  } else if (vibration < 4.0) {
    activity = "DRIVING";
  } else {
    activity = "WORKING";
  }

  jsonPayload += "\"activity\":{";
  jsonPayload += "\"state\":\"" + activity + "\"";
  jsonPayload += "}";

  jsonPayload += "}";

  // Send HTTP POST request
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.println("Sending data...");
  Serial.println("Payload: " + jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✓ Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("✓ Response: ");
    Serial.println(response);

    // Print sensor values
    Serial.println("\nSensor Readings:");
    Serial.printf("  Accel: X=%.2f Y=%.2f Z=%.2f g\n",
      accel.acceleration.x / 9.81,
      accel.acceleration.y / 9.81,
      accel.acceleration.z / 9.81);
    Serial.printf("  Gyro:  X=%.1f Y=%.1f Z=%.1f °/s\n",
      gyro.gyro.x * 57.2958,
      gyro.gyro.y * 57.2958,
      gyro.gyro.z * 57.2958);
    Serial.printf("  Temp:  %.1f°C\n", temp.temperature);
    Serial.printf("  Vibration: %.3f g\n", vibration / 9.81);
    Serial.printf("  Activity: %s\n\n", activity.c_str());

  } else {
    Serial.print("✗ Error sending data: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
  Serial.println("----------------------------------------\n");
}

//==================================================
// ARDUINO SETUP
//==================================================

void setup() {
  // Start Serial
  Serial.begin(115200);
  delay(1000);

  // Initialize I2C for MPU6050
  Wire.begin();

  // Setup WiFi
  setupWiFi();

  // Setup MPU6050
  setupMPU6050();

  Serial.println("========================================");
  Serial.println("System Ready - Starting Data Stream");
  Serial.println("========================================\n");
}

//==================================================
// ARDUINO LOOP
//==================================================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    setupWiFi();
  }

  // Send sensor data at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastSend >= SEND_INTERVAL) {
    lastSend = currentMillis;
    sendSensorData();
  }

  delay(10);  // Small delay to prevent watchdog issues
}
