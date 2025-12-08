/**
 * Activity State Classifier
 * Determines forklift activity state based on sensor fusion
 * Uses MPU6050 accelerometer/gyroscope data combined with other sensors
 */

/**
 * Classify activity state from sensor data
 * @param {Object} telemetryData - Full telemetry object
 * @returns {String} Activity state: PARKED, IDLE, DRIVING, WORKING, CHARGING, or UNKNOWN
 */
function classifyActivityState(telemetryData) {
  const { accelerometer, ultrasonic, rfid, activity } = telemetryData;

  // Priority 1: CHARGING (RFID detected at charging station)
  if (rfid?.tagDetected && rfid.stationName?.toLowerCase().includes('charging')) {
    return 'CHARGING';
  }

  // Priority 2: WORKING (Fork raised with load or actively loading/unloading)
  if (ultrasonic?.loadDetected || activity?.forkState === 'RAISED' || activity?.forkState === 'PALLET_HEIGHT') {
    return 'WORKING';
  }

  // Priority 3: Movement-based classification using MPU6050
  if (accelerometer) {
    const vibration = accelerometer.vibrationMagnitude || 0;
    const movement = accelerometer.movementDetected;
    const tilt = accelerometer.tiltAngle || 0;

    // DRIVING: Significant vibration and movement
    if (movement && vibration > 0.15) {
      return 'DRIVING';
    }

    // IDLE: Minimal movement, engine might be on but not moving
    if (vibration > 0.05 && vibration <= 0.15) {
      return 'IDLE';
    }

    // PARKED: No significant movement or vibration
    if (vibration <= 0.05 && !movement) {
      return 'PARKED';
    }
  }

  // Fallback to existing activity state or UNKNOWN
  return activity?.state || 'UNKNOWN';
}

/**
 * Classify fork state from ultrasonic sensor
 * @param {Object} ultrasonic - Ultrasonic sensor data
 * @returns {String} Fork state: DOWN, PALLET_HEIGHT, RAISED, or UNKNOWN
 */
function classifyForkState(ultrasonic) {
  if (!ultrasonic || ultrasonic.forkHeight === undefined) {
    return 'UNKNOWN';
  }

  const height = ultrasonic.forkHeight;

  if (height < 50) return 'DOWN';
  if (height >= 50 && height < 150) return 'PALLET_HEIGHT';
  if (height >= 150) return 'RAISED';

  return 'UNKNOWN';
}

/**
 * Detect potential collision risk from ultrasonic sensors
 * @param {Object} ultrasonic - Ultrasonic sensor data
 * @returns {Object} Collision warnings
 */
function detectCollisionRisk(ultrasonic) {
  if (!ultrasonic) {
    return { frontWarning: false, frontDanger: false, rearWarning: false, rearDanger: false };
  }

  const DANGER_DISTANCE = 30;  // cm
  const WARNING_DISTANCE = 100; // cm

  return {
    frontWarning: ultrasonic.frontObstacle > 0 && ultrasonic.frontObstacle <= WARNING_DISTANCE,
    frontDanger: ultrasonic.frontObstacle > 0 && ultrasonic.frontObstacle <= DANGER_DISTANCE,
    rearWarning: ultrasonic.rearObstacle > 0 && ultrasonic.rearObstacle <= WARNING_DISTANCE,
    rearDanger: ultrasonic.rearObstacle > 0 && ultrasonic.rearObstacle <= DANGER_DISTANCE,
  };
}

/**
 * Enrich telemetry data with calculated fields
 * @param {Object} telemetryData - Raw telemetry data
 * @returns {Object} Enhanced telemetry with calculated activity states
 */
function enrichTelemetryData(telemetryData) {
  const enriched = { ...telemetryData };

  // Classify activity state
  if (!enriched.activity) {
    enriched.activity = {};
  }
  enriched.activity.state = classifyActivityState(telemetryData);
  enriched.activity.inMotion = telemetryData.accelerometer?.movementDetected || false;

  // Classify fork state
  if (telemetryData.ultrasonic) {
    enriched.activity.forkState = classifyForkState(telemetryData.ultrasonic);
  }

  // Add collision warnings to ultrasonic data
  if (telemetryData.ultrasonic) {
    const collisionRisk = detectCollisionRisk(telemetryData.ultrasonic);
    enriched.ultrasonic = { ...telemetryData.ultrasonic, ...collisionRisk };
  }

  return enriched;
}

module.exports = {
  classifyActivityState,
  classifyForkState,
  detectCollisionRisk,
  enrichTelemetryData
};
