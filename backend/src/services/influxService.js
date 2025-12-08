const { InfluxDB } = require('@influxdata/influxdb-client');

/**
 * InfluxDB Service for querying sensor data
 */
class InfluxService {
  constructor() {
    const url = process.env.INFLUX_URL;
    const token = process.env.INFLUX_TOKEN;
    const org = process.env.INFLUX_ORG;
    const bucket = process.env.INFLUX_BUCKET;

    if (!url || !token || !org || !bucket) {
      console.warn('[InfluxDB] Missing configuration. Sensor data queries will be unavailable.');
      this.enabled = false;
      return;
    }

    this.influxDB = new InfluxDB({ url, token });
    this.queryApi = this.influxDB.getQueryApi(org);
    this.org = org;
    this.bucket = bucket;
    this.enabled = true;

    console.log(`[InfluxDB] Service initialized for ${url}`);
  }

  /**
   * Get latest sensor data for a forklift
   * @param {string} forkliftId - Forklift ID
   * @returns {Promise<Object|null>} Latest sensor reading
   */
  async getLatestSensorData(forkliftId) {
    if (!this.enabled) {
      return null;
    }

    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -1h)
          |> filter(fn: (r) => r._measurement == "mpu6050")
          |> filter(fn: (r) => r.forklift_id == "${forkliftId}")
          |> last()
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      `;

      const result = await this.queryApi.collectRows(query);

      if (result.length === 0) {
        return null;
      }

      // Return the latest reading
      const row = result[0];
      return {
        forkliftId: row.forklift_id,
        timestamp: row._time,
        accelX: row.accel_x || 0,
        accelY: row.accel_y || 0,
        accelZ: row.accel_z || 0,
        gyroX: row.gyro_x || 0,
        gyroY: row.gyro_y || 0,
        gyroZ: row.gyro_z || 0,
        accelTotal: row.accel_total_g || 0,
        vibration: row.vibration_g || 0,
        tiltAngle: row.tilt_angle || 0
      };
    } catch (error) {
      console.error('[InfluxDB] Error querying latest sensor data:', error.message);
      throw error;
    }
  }

  /**
   * Get sensor data history for a forklift
   * @param {string} forkliftId - Forklift ID
   * @param {Object} options - Query options (startTime, endTime, limit)
   * @returns {Promise<Array>} Array of sensor readings
   */
  async getSensorHistory(forkliftId, options = {}) {
    if (!this.enabled) {
      return [];
    }

    try {
      const { startTime = '-1h', endTime = 'now()', limit = 100 } = options;

      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: ${startTime}, stop: ${endTime})
          |> filter(fn: (r) => r._measurement == "mpu6050")
          |> filter(fn: (r) => r.forklift_id == "${forkliftId}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> limit(n: ${limit})
      `;

      const result = await this.queryApi.collectRows(query);

      return result.map(row => ({
        forkliftId: row.forklift_id,
        timestamp: row._time,
        accelX: row.accel_x || 0,
        accelY: row.accel_y || 0,
        accelZ: row.accel_z || 0,
        gyroX: row.gyro_x || 0,
        gyroY: row.gyro_y || 0,
        gyroZ: row.gyro_z || 0,
        accelTotal: row.accel_total_g || 0,
        vibration: row.vibration_g || 0,
        tiltAngle: row.tilt_angle || 0
      }));
    } catch (error) {
      console.error('[InfluxDB] Error querying sensor history:', error.message);
      throw error;
    }
  }

  /**
   * Get aggregated sensor statistics
   * @param {string} forkliftId - Forklift ID
   * @param {string} window - Time window (e.g., '5m', '1h')
   * @returns {Promise<Array>} Aggregated statistics
   */
  async getAggregatedStats(forkliftId, window = '5m') {
    if (!this.enabled) {
      return [];
    }

    try {
      const query = `
        from(bucket: "${this.bucket}")
          |> range(start: -24h)
          |> filter(fn: (r) => r._measurement == "mpu6050")
          |> filter(fn: (r) => r.forklift_id == "${forkliftId}")
          |> filter(fn: (r) => r._field == "vibration_g" or r._field == "tilt_angle" or r._field == "accel_total_g")
          |> aggregateWindow(every: ${window}, fn: mean, createEmpty: false)
      `;

      const result = await this.queryApi.collectRows(query);

      // Group by time window
      const stats = {};
      result.forEach(row => {
        const timeKey = row._time;
        if (!stats[timeKey]) {
          stats[timeKey] = { timestamp: timeKey };
        }
        stats[timeKey][row._field] = row._value;
      });

      return Object.values(stats);
    } catch (error) {
      console.error('[InfluxDB] Error querying aggregated stats:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new InfluxService();
