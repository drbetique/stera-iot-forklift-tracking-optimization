cloud#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include "secrets.h"  // WiFi and MQTT credentials (copy secrets.h.template to secrets.h)

//////////////////////////////
// CONFIGURATION (from secrets.h)
//////////////////////////////

// All credentials are now in secrets.h
// No hardcoded credentials here!

//////////////////////////////
// OBJECTS
//////////////////////////////

WiFiClient espClient;
PubSubClient client(espClient);
MPU6050 mpu;

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL_MS = 200;  // 5 Hz

//////////////////////////////
// WIFI SETUP
//////////////////////////////

void setupWifi() {
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
    Serial.println();
    Serial.println("[OK] WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[ERROR] WiFi connection failed");
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

//////////////////////////////
// MQTT SETUP
//////////////////////////////

void reconnectMQTT() {
  int attempts = 0;
  
  while (!client.connected() && attempts < 5) {
    Serial.print("Connecting to MQTT...");
    
    // Create unique client ID
    String clientId = "ESP32-";
    clientId += FORKLIFT_ID;
    
    if (client.connect(clientId.c_str())) {
      Serial.println("[OK] connected");
    } else {
      Serial.print("[ERROR] failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry in 2s");
      delay(2000);
      attempts++;
    }
  }
  
  if (!client.connected()) {
    Serial.println("MQTT connection failed after 5 attempts");
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

//////////////////////////////
// MPU6050 SETUP
//////////////////////////////

void setupMPU() {
  Wire.begin();
  mpu.initialize();
  
  if (mpu.testConnection()) {
    Serial.println("[OK] MPU6050 connected");
  } else {
    Serial.println("[ERROR] MPU6050 connection failed");
    Serial.println("Check wiring: SDA=GPIO21, SCL=GPIO22");
  }
}

//////////////////////////////
// MAIN SETUP
//////////////////////////////

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println();
  Serial.println("================================");
  Serial.println("Stera Forklift Sensor Node");
  Serial.print("Forklift ID: ");
  Serial.println(FORKLIFT_ID);
  Serial.println("================================");
  
  setupWifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  setupMPU();
  
  Serial.println();
  Serial.println("Setup complete. Starting data transmission...");
  Serial.println();
}

//////////////////////////////
// MAIN LOOP
//////////////////////////////

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi disconnected, reconnecting...");
    setupWifi();
  }
  
  // Publish at defined interval
  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;
    
    // Read sensor data
    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    
    // Convert to physical units
    // Accelerometer: +/- 2g range, 16384 LSB/g
    float accelX = ax / 16384.0;
    float accelY = ay / 16384.0;
    float accelZ = az / 16384.0;
    
    // Gyroscope: +/- 250 deg/s range, 131 LSB/(deg/s)
    float gyroX = gx / 131.0;
    float gyroY = gy / 131.0;
    float gyroZ = gz / 131.0;
    
    // Build JSON payload with forklift_id
    char payload[300];
    snprintf(payload, sizeof(payload),
             "{\"forklift_id\":\"%s\","
             "\"accel_x\":%.4f,\"accel_y\":%.4f,\"accel_z\":%.4f,"
             "\"gyro_x\":%.4f,\"gyro_y\":%.4f,\"gyro_z\":%.4f}",
             FORKLIFT_ID,
             accelX, accelY, accelZ,
             gyroX, gyroY, gyroZ);
    
    // Publish to MQTT
    if (client.publish(MQTT_TOPIC, payload)) {
      Serial.print("[TX] ");
      Serial.println(payload);
    } else {
      Serial.println("[ERROR] Publish failed");
    }
  }
}
