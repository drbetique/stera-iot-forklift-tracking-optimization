import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function DetailsScreen({ route }) {
  const { forklift } = route.params;
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const response = await api.getLatestTelemetry(forklift.forkliftId);
      if (response.success) {
        setTelemetry(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTelemetry();
  };

  const getActivityColor = (activity) => {
    const colors = {
      'DRIVING': '#3b82f6',
      'WORKING': '#10b981',
      'IDLE': '#f59e0b',
      'PARKED': '#6b7280',
      'CHARGING': '#8b5cf6',
      'UNKNOWN': '#9ca3af'
    };
    return colors[activity] || colors.UNKNOWN;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.icon}>🚜</Text>
        <Text style={styles.title}>{forklift.name}</Text>
        <Text style={styles.subtitle}>{forklift.forkliftId}</Text>
        <View style={[styles.activityBadge, { backgroundColor: getActivityColor(forklift.currentActivity) }]}>
          <Text style={styles.activityText}>{forklift.currentActivity}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Basic Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Model:</Text>
            <Text style={styles.value}>{forklift.model || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Serial Number:</Text>
            <Text style={styles.value}>{forklift.serialNumber || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.statusBadge, { backgroundColor: forklift.status === 'active' ? '#d1fae5' : '#fee2e2' }]}>
              {forklift.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Battery Level:</Text>
            <Text style={styles.value}>{forklift.batteryLevel || 0}%</Text>
          </View>
        </View>
      </View>

      {telemetry && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Latitude:</Text>
                <Text style={styles.valueCode}>{telemetry.gps?.latitude?.toFixed(6) || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Longitude:</Text>
                <Text style={styles.valueCode}>{telemetry.gps?.longitude?.toFixed(6) || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Speed:</Text>
                <Text style={styles.value}>{telemetry.gps?.speed?.toFixed(1) || 0} km/h</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Satellites:</Text>
                <Text style={styles.value}>{telemetry.gps?.satellites || 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📏 Fork Status</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fork Height:</Text>
                <Text style={styles.value}>{telemetry.ultrasonic?.forkHeight?.toFixed(1) || 0} cm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fork State:</Text>
                <Text style={styles.value}>{telemetry.activity?.forkState || 'UNKNOWN'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Load Detected:</Text>
                <Text style={styles.value}>{telemetry.ultrasonic?.loadDetected ? 'Yes ✓' : 'No ✗'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Activity</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Engine:</Text>
                <Text style={styles.value}>{telemetry.activity?.engineOn ? 'ON' : 'OFF'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>In Motion:</Text>
                <Text style={styles.value}>{telemetry.activity?.inMotion ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Vibration:</Text>
                <Text style={styles.value}>{telemetry.accelerometer?.vibrationMagnitude?.toFixed(2) || 0} g</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Tilt Angle:</Text>
                <Text style={styles.value}>{telemetry.accelerometer?.tiltAngle?.toFixed(1) || 0}°</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Safety</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Front Obstacle:</Text>
                <Text style={styles.value}>{telemetry.ultrasonic?.frontObstacle?.toFixed(0) || 0} cm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Rear Obstacle:</Text>
                <Text style={styles.value}>{telemetry.ultrasonic?.rearObstacle?.toFixed(0) || 0} cm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Front Warning:</Text>
                <Text style={[styles.value, { color: telemetry.ultrasonic?.frontWarning ? '#ef4444' : '#10b981' }]}>
                  {telemetry.ultrasonic?.frontWarning ? '⚠️ YES' : '✓ Clear'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Rear Warning:</Text>
                <Text style={[styles.value, { color: telemetry.ultrasonic?.rearWarning ? '#ef4444' : '#10b981' }]}>
                  {telemetry.ultrasonic?.rearWarning ? '⚠️ YES' : '✓ Clear'}
                </Text>
              </View>
            </View>
          </View>

          {telemetry.rfid?.tagDetected && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📌 Current Station</Text>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Station:</Text>
                  <Text style={styles.value}>{telemetry.rfid?.stationName || 'Unknown'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tag ID:</Text>
                  <Text style={styles.valueCode}>{telemetry.rfid?.tagId || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Last Update</Text>
            <View style={styles.card}>
              <Text style={styles.timestamp}>
                {new Date(telemetry.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  activityBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  valueCode: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});