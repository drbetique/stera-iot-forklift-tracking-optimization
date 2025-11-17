import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import {
  formatBattery,
  formatCoordinates,
  formatRelativeTime,
  formatSpeed,
  formatDecimal,
  getActivityColor,
  getBatteryColor,
  getBatteryStatus
} from '../utils/formatters';

export default function DetailsScreen({ route }) {
  const { forklift } = route.params;
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // Auto-refresh every 5 seconds
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

  const handleShare = async () => {
    try {
      const message = `Forklift: ${forklift.name} (${forklift.forkliftId})
Status: ${forklift.currentActivity}
Battery: ${formatBattery(forklift.batteryLevel)}
Location: ${forklift.lastKnownLocation?.coordinates
  ? formatCoordinates(forklift.lastKnownLocation.coordinates[1], forklift.lastKnownLocation.coordinates[0])
  : 'N/A'}`;

      await Share.share({
        message: message,
        title: `${forklift.name} Details`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚜</Text>
        </View>
        <Text style={styles.title}>{forklift.name}</Text>
        <Text style={styles.subtitle}>{forklift.forkliftId}</Text>
        <View style={[styles.activityBadge, { backgroundColor: getActivityColor(forklift.currentActivity) }]}>
          <Text style={styles.activityText}>{forklift.currentActivity}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Battery</Text>
          <Text style={[styles.statValue, { color: getBatteryColor(forklift.batteryLevel) }]}>
            {formatBattery(forklift.batteryLevel)}
          </Text>
          <Text style={styles.statSubtext}>{getBatteryStatus(forklift.batteryLevel)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={[styles.statValue, { color: forklift.status === 'active' ? COLORS.success : COLORS.error }]}>
            {forklift.status?.toUpperCase()}
          </Text>
          <Text style={styles.statSubtext}>{formatRelativeTime(forklift.lastSeen)}</Text>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Basic Information</Text>
        <View style={styles.card}>
          <InfoRow label="Model" value={forklift.model || 'N/A'} />
          <InfoRow label="Serial Number" value={forklift.serialNumber || 'N/A'} />
          <InfoRow
            label="Location"
            value={forklift.lastKnownLocation?.coordinates
              ? formatCoordinates(forklift.lastKnownLocation.coordinates[1], forklift.lastKnownLocation.coordinates[0])
              : 'N/A'}
          />
          <InfoRow label="Last Seen" value={formatRelativeTime(forklift.lastSeen)} isLast />
        </View>
      </View>

      {/* Real-time Telemetry */}
      {telemetry && (
        <>
          {/* GPS Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 GPS & Movement</Text>
            <View style={styles.card}>
              <InfoRow
                label="Coordinates"
                value={telemetry.gps?.latitude && telemetry.gps?.longitude
                  ? formatCoordinates(telemetry.gps.latitude, telemetry.gps.longitude, 6)
                  : 'N/A'}
              />
              <InfoRow
                label="Speed"
                value={formatSpeed(telemetry.gps?.speed || 0)}
              />
              <InfoRow
                label="Satellites"
                value={`${telemetry.gps?.satellites || 0} connected`}
              />
              <InfoRow
                label="In Motion"
                value={telemetry.activity?.inMotion ? 'Yes ✓' : 'No ✗'}
                isLast
              />
            </View>
          </View>

          {/* Fork & Load Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Fork Status</Text>
            <View style={styles.card}>
              <InfoRow
                label="Fork Height"
                value={`${formatDecimal(telemetry.ultrasonic?.forkHeight || 0, 1)} cm`}
              />
              <InfoRow
                label="Fork State"
                value={telemetry.activity?.forkState || 'UNKNOWN'}
              />
              <InfoRow
                label="Load Detected"
                value={telemetry.ultrasonic?.loadDetected ? 'Yes ✓' : 'No ✗'}
                valueColor={telemetry.ultrasonic?.loadDetected ? COLORS.success : COLORS.text.secondary}
                isLast
              />
            </View>
          </View>

          {/* Activity & Engine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Activity & Engine</Text>
            <View style={styles.card}>
              <InfoRow
                label="Engine"
                value={telemetry.activity?.engineOn ? 'ON' : 'OFF'}
                valueColor={telemetry.activity?.engineOn ? COLORS.success : COLORS.error}
              />
              <InfoRow
                label="Vibration"
                value={`${formatDecimal(telemetry.accelerometer?.vibrationMagnitude || 0, 2)} g`}
              />
              <InfoRow
                label="Tilt Angle"
                value={`${formatDecimal(telemetry.accelerometer?.tiltAngle || 0, 1)}°`}
                isLast
              />
            </View>
          </View>

          {/* Safety & Obstacles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Safety & Obstacles</Text>
            <View style={styles.card}>
              <InfoRow
                label="Front Obstacle"
                value={`${Math.round(telemetry.ultrasonic?.frontObstacle || 0)} cm`}
              />
              <InfoRow
                label="Front Warning"
                value={telemetry.ultrasonic?.frontWarning ? '⚠️ WARNING' : '✓ Clear'}
                valueColor={telemetry.ultrasonic?.frontWarning ? COLORS.error : COLORS.success}
              />
              <InfoRow
                label="Rear Obstacle"
                value={`${Math.round(telemetry.ultrasonic?.rearObstacle || 0)} cm`}
              />
              <InfoRow
                label="Rear Warning"
                value={telemetry.ultrasonic?.rearWarning ? '⚠️ WARNING' : '✓ Clear'}
                valueColor={telemetry.ultrasonic?.rearWarning ? COLORS.error : COLORS.success}
                isLast
              />
            </View>
          </View>

          {/* RFID Station (if detected) */}
          {telemetry.rfid?.tagDetected && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📌 Current Station</Text>
              <View style={styles.card}>
                <InfoRow
                  label="Station Name"
                  value={telemetry.rfid?.stationName || 'Unknown'}
                />
                <InfoRow
                  label="Tag ID"
                  value={telemetry.rfid?.tagId || 'N/A'}
                  valueStyle={styles.monoText}
                  isLast
                />
              </View>
            </View>
          )}

          {/* Last Update */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Last Update</Text>
            <View style={styles.card}>
              <Text style={styles.timestamp}>
                {new Date(telemetry.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </Text>
              <Text style={styles.timestampRelative}>
                {formatRelativeTime(telemetry.timestamp)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
        <Text style={styles.shareIcon}>📤</Text>
        <Text style={styles.shareText}>Share Details</Text>
      </TouchableOpacity>

      {/* Bottom Spacing */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// Reusable InfoRow Component
const InfoRow = ({ label, value, valueColor, valueStyle, isLast = false }) => (
  <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, valueColor && { color: valueColor }, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
  },

  // Header Card
  headerCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xxxl,
    alignItems: 'center',
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.lighter,
    marginBottom: SPACING.lg,
  },
  activityBadge: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  activityText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  statSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  // Card
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'right',
    flex: 1,
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // Timestamp
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.xs,
  },
  timestampRelative: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },

  // Share Button
  shareButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  shareIcon: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    marginRight: SPACING.sm,
  },
  shareText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
