import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { formatRelativeTime, formatPercentage } from '../utils/formatters';

export default function NotificationsScreen() {
  const [forklifts, setForklifts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getForklifts();
      if (Array.isArray(data)) {
        setForklifts(data);
        generateNotifications(data);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch forklifts for notifications:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateNotifications = (forkliftData) => {
    const newNotifications = [];

    forkliftData.forEach((forklift) => {
      const batteryLevel = forklift.batteryLevel || 0;
      const activity = forklift.currentActivity || 'UNKNOWN';
      const forkliftName = forklift.name || 'Unknown Forklift';
      const timestamp = new Date(forklift.lastSeen || Date.now());

      // Critical battery alert (highest priority)
      if (batteryLevel < 20) {
        newNotifications.push({
          id: `battery-critical-${forklift._id}`,
          type: 'critical',
          title: '🔴 Critical Battery Level',
          message: `${forkliftName} battery at ${formatPercentage(batteryLevel)}`,
          detail: 'Immediate charging required',
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 1,
        });
      }
      // Low battery warning
      else if (batteryLevel >= 20 && batteryLevel <= 40) {
        newNotifications.push({
          id: `battery-low-${forklift._id}`,
          type: 'warning',
          title: '⚠️ Low Battery Warning',
          message: `${forkliftName} battery at ${formatPercentage(batteryLevel)}`,
          detail: 'Plan for charging soon',
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 2,
        });
      }

      // Idle too long
      if (activity === 'IDLE') {
        newNotifications.push({
          id: `idle-${forklift._id}`,
          type: 'warning',
          title: '⏸️ Forklift Idle',
          message: `${forkliftName} has been idle`,
          detail: 'Consider reassigning to active work',
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 3,
        });
      }

      // Parked for long time
      if (activity === 'PARKED') {
        newNotifications.push({
          id: `parked-${forklift._id}`,
          type: 'info',
          title: '🅿️ Forklift Parked',
          message: `${forkliftName} is currently parked`,
          detail: 'Last seen ' + formatRelativeTime(forklift.lastSeen),
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 4,
        });
      }

      // High productivity (success)
      if (activity === 'WORKING' && batteryLevel > 60) {
        newNotifications.push({
          id: `productivity-${forklift._id}`,
          type: 'success',
          title: '✅ High Productivity',
          message: `${forkliftName} is performing well`,
          detail: `Battery: ${formatPercentage(batteryLevel)}, Status: ${activity}`,
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 5,
        });
      }

      // Charging status
      if (activity === 'CHARGING') {
        newNotifications.push({
          id: `charging-${forklift._id}`,
          type: 'info',
          title: '🔋 Charging in Progress',
          message: `${forkliftName} is charging`,
          detail: `Current battery: ${formatPercentage(batteryLevel)}`,
          timestamp,
          read: false,
          forkliftId: forklift._id,
          forkliftName,
          priority: 6,
        });
      }
    });

    // Sort by priority (lower number = higher priority)
    newNotifications.sort((a, b) => a.priority - b.priority);

    setNotifications(newNotifications);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const markAsRead = (notificationId) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const clearRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => !notif.read)
    );
  };

  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter(
    (n) => n.type === 'critical' && !n.read
  ).length;
  const warningCount = notifications.filter(
    (n) => n.type === 'warning' && !n.read
  ).length;

  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'success':
        return COLORS.success;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.text.secondary;
    }
  };

  const getNotificationBg = (type, read) => {
    const baseOpacity = read ? '10' : '20';
    switch (type) {
      case 'critical':
        return COLORS.error + baseOpacity;
      case 'warning':
        return COLORS.warning + baseOpacity;
      case 'success':
        return COLORS.success + baseOpacity;
      case 'info':
        return COLORS.info + baseOpacity;
      default:
        return COLORS.background.secondary;
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: getNotificationBg(item.type, item.read),
          opacity: item.read ? 0.6 : 1,
          borderLeftColor: getNotificationColor(item.type),
        },
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <Text
          style={[
            styles.notificationTitle,
            { color: getNotificationColor(item.type) },
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.notificationTime}>
          {formatRelativeTime(item.timestamp)}
        </Text>
      </View>

      <Text style={styles.notificationMessage}>{item.message}</Text>

      {item.detail && (
        <Text style={styles.notificationDetail}>{item.detail}</Text>
      )}

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {criticalCount > 0 && (
            <View style={[styles.statBadge, { backgroundColor: COLORS.error + '20' }]}>
              <Text style={[styles.statBadgeIcon, { color: COLORS.error }]}>
                🔴
              </Text>
              <Text style={[styles.statBadgeText, { color: COLORS.error }]}>
                {criticalCount} Critical
              </Text>
            </View>
          )}
          {warningCount > 0 && (
            <View style={[styles.statBadge, { backgroundColor: COLORS.warning + '20' }]}>
              <Text style={[styles.statBadgeIcon, { color: COLORS.warning }]}>
                ⚠️
              </Text>
              <Text style={[styles.statBadgeText, { color: COLORS.warning }]}>
                {warningCount} Warning
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.actionButtonText}>Mark All Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={clearRead}
            >
              <Text style={styles.actionButtonText}>Clear Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearAllButton]}
              onPress={clearAll}
            >
              <Text style={[styles.actionButtonText, styles.clearAllButtonText]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            Alerts and updates will appear here
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

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
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  header: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  statBadgeIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  statBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  clearAllButton: {
    backgroundColor: COLORS.error + '20',
  },
  clearAllButtonText: {
    color: COLORS.error,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  notificationCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.tertiary,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  notificationDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});
