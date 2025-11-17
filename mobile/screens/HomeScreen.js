import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  Animated
} from 'react-native';
import api from '../services/api';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS, COMMON_STYLES } from '../styles/theme';
import { formatBattery, formatCoordinates, formatRelativeTime, getActivityColor, getBatteryColor } from '../utils/formatters';

export default function HomeScreen({ navigation }) {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, battery, activity

  // Animation for LIVE indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchData();
    checkConnection();

    const interval = setInterval(() => {
      fetchData();
      checkConnection();
    }, 10000);

    // Pulse animation for LIVE indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      await api.healthCheck();
      setConnectionStatus('Connected');
    } catch (error) {
      setConnectionStatus('Disconnected');
    }
  };

  const fetchData = async () => {
    try {
      const data = await api.getForklifts();
      if (Array.isArray(data)) {
        setForklifts(data);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch forklifts:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate statistics
  const stats = {
    total: forklifts.length,
    active: forklifts.filter(f => ['DRIVING', 'WORKING', 'IDLE'].includes(f.currentActivity)).length,
    working: forklifts.filter(f => f.currentActivity === 'WORKING').length,
    avgBattery: forklifts.length > 0
      ? Math.round(forklifts.reduce((sum, f) => sum + (f.batteryLevel || 0), 0) / forklifts.length)
      : 0
  };

  // Activity distribution data
  const activityData = {
    DRIVING: forklifts.filter(f => f.currentActivity === 'DRIVING').length,
    WORKING: forklifts.filter(f => f.currentActivity === 'WORKING').length,
    IDLE: forklifts.filter(f => f.currentActivity === 'IDLE').length,
    PARKED: forklifts.filter(f => f.currentActivity === 'PARKED').length,
    CHARGING: forklifts.filter(f => f.currentActivity === 'CHARGING').length,
  };

  // Battery statistics
  const batteryStats = {
    average: stats.avgBattery,
    critical: forklifts.filter(f => f.batteryLevel < 20).length,
    warning: forklifts.filter(f => f.batteryLevel >= 20 && f.batteryLevel < 50).length,
    good: forklifts.filter(f => f.batteryLevel >= 50).length,
  };

  // Fleet performance metrics
  const fleetMetrics = {
    utilization: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
    productive: activityData.DRIVING + activityData.WORKING,
    standby: activityData.IDLE + activityData.PARKED,
  };

  // Filter and sort forklifts
  const getFilteredAndSortedForklifts = () => {
    let filtered = forklifts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.forkliftId.toLowerCase().includes(query) ||
        f.model?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'battery') {
        return (b.batteryLevel || 0) - (a.batteryLevel || 0);
      } else if (sortBy === 'activity') {
        return a.currentActivity.localeCompare(b.currentActivity);
      }
      return 0;
    });

    return filtered;
  };

  const renderForklift = ({ item }) => (
    <TouchableOpacity
      style={styles.forkliftCard}
      onPress={() => navigation.navigate('Details', { forklift: item })}
      activeOpacity={0.7}
    >
      <View style={[styles.cardHeader, { backgroundColor: COLORS.primary }]}>
        <View style={styles.forkliftInfo}>
          <View style={styles.forkliftIconContainer}>
            <Text style={styles.forkliftIcon}>🚜</Text>
          </View>
          <View style={styles.forkliftDetails}>
            <Text style={styles.forkliftName}>{item.name}</Text>
            <Text style={styles.forkliftId}>{item.forkliftId}</Text>
          </View>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: getActivityColor(item.currentActivity) }]}>
          <Text style={styles.activityText}>{item.currentActivity}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Model</Text>
          <Text style={styles.value}>{item.model || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Battery</Text>
          <View style={styles.batteryContainer}>
            <View style={styles.batteryBarBackground}>
              <View
                style={[
                  styles.batteryBarFill,
                  {
                    width: `${item.batteryLevel || 0}%`,
                    backgroundColor: getBatteryColor(item.batteryLevel)
                  }
                ]}
              />
            </View>
            <Text style={styles.batteryText}>{formatBattery(item.batteryLevel)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.valueSmall} numberOfLines={1}>
            {item.lastKnownLocation?.coordinates
              ? formatCoordinates(item.lastKnownLocation.coordinates[1], item.lastKnownLocation.coordinates[0])
              : 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Status</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.error }
          ]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>Last Seen</Text>
          <Text style={styles.valueSmall}>{formatRelativeTime(item.lastSeen)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View Full Details →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading fleet data...</Text>
      </View>
    );
  }

  const filteredForklifts = getFilteredAndSortedForklifts();

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
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/stera-logo.jpg')}
            style={styles.steraLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Forklift Fleet</Text>
          <Text style={styles.title}>Management Dashboard</Text>
        </View>
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.connectionRow}>
          <View style={[styles.connectionDot, {
            backgroundColor: connectionStatus === 'Connected' ? COLORS.success : COLORS.error
          }]} />
          <Text style={styles.connectionText}>{connectionStatus}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Forklifts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.working}</Text>
          <Text style={styles.statLabel}>Working</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.avgBattery}%</Text>
          <Text style={styles.statLabel}>Avg Battery</Text>
        </View>
      </View>

      {/* Analytics Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Analytics</Text>
      </View>

      {/* Activity Distribution */}
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsCardTitle}>Activity Distribution</Text>
        <Text style={styles.analyticsCardSubtitle}>Real-time fleet status breakdown</Text>

        {Object.entries(activityData).map(([activity, count]) => {
          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          const activityIcons = {
            DRIVING: '🚗',
            WORKING: '⚙️',
            IDLE: '⏸️',
            PARKED: '🅿️',
            CHARGING: '🔋'
          };

          return (
            <View key={activity} style={styles.activityBar}>
              <View style={styles.activityBarHeader}>
                <Text style={styles.activityIcon}>{activityIcons[activity]}</Text>
                <Text style={styles.activityName}>{activity}</Text>
                <Text style={styles.activityCount}>{count}</Text>
              </View>
              <View style={styles.activityBarTrack}>
                <View
                  style={[
                    styles.activityBarFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: getActivityColor(activity)
                    }
                  ]}
                >
                  <Text style={styles.activityPercentage}>{percentage}%</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.activitySummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Productive</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {fleetMetrics.productive}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Standby</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {fleetMetrics.standby}
            </Text>
          </View>
        </View>
      </View>

      {/* Battery Status */}
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsCardTitle}>🔋 Battery Status</Text>
        <Text style={styles.analyticsCardSubtitle}>Fleet power overview</Text>

        <View style={styles.batteryGaugeContainer}>
          <View style={styles.batteryGauge}>
            <Text style={styles.batteryGaugeValue}>{stats.avgBattery}%</Text>
            <Text style={styles.batteryGaugeLabel}>Average</Text>
          </View>

          <View style={styles.batteryStatsGrid}>
            <View style={styles.batteryStatItem}>
              <Text style={[styles.batteryStatIcon, { color: COLORS.success }]}>✓</Text>
              <Text style={styles.batteryStatValue}>{batteryStats.good}</Text>
              <Text style={styles.batteryStatLabel}>Good (≥50%)</Text>
            </View>
            <View style={styles.batteryStatItem}>
              <Text style={[styles.batteryStatIcon, { color: COLORS.warning }]}>⚠</Text>
              <Text style={styles.batteryStatValue}>{batteryStats.warning}</Text>
              <Text style={styles.batteryStatLabel}>Warning</Text>
            </View>
            <View style={styles.batteryStatItem}>
              <Text style={[styles.batteryStatIcon, { color: COLORS.error }]}>⚠</Text>
              <Text style={styles.batteryStatValue}>{batteryStats.critical}</Text>
              <Text style={styles.batteryStatLabel}>Critical</Text>
            </View>
          </View>
        </View>

        {batteryStats.critical > 0 && (
          <View style={styles.batteryAlert}>
            <Text style={styles.batteryAlertIcon}>⚠️</Text>
            <Text style={styles.batteryAlertText}>
              {batteryStats.critical} forklift{batteryStats.critical > 1 ? 's' : ''} need{batteryStats.critical === 1 ? 's' : ''} charging
            </Text>
          </View>
        )}
      </View>

      {/* Fleet Performance */}
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsCardTitle}>📈 Fleet Performance</Text>
        <Text style={styles.analyticsCardSubtitle}>Key operational metrics</Text>

        <View style={styles.performanceMetrics}>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceLabel}>Fleet Utilization</Text>
            <Text style={styles.performanceValue}>{fleetMetrics.utilization}%</Text>
            <View style={styles.utilizationBar}>
              <View
                style={[
                  styles.utilizationBarFill,
                  {
                    width: `${fleetMetrics.utilization}%`,
                    backgroundColor: fleetMetrics.utilization >= 70 ? COLORS.success :
                                     fleetMetrics.utilization >= 40 ? COLORS.warning : COLORS.error
                  }
                ]}
              />
            </View>
          </View>

          <View style={styles.performanceRow}>
            <View style={styles.performanceMetricSmall}>
              <Text style={styles.performanceLabelSmall}>Productive Units</Text>
              <Text style={[styles.performanceValueSmall, { color: COLORS.success }]}>
                {fleetMetrics.productive}
              </Text>
            </View>
            <View style={styles.performanceMetricSmall}>
              <Text style={styles.performanceLabelSmall}>Standby Units</Text>
              <Text style={[styles.performanceValueSmall, { color: COLORS.warning }]}>
                {fleetMetrics.standby}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Fleet Overview Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🚜 Fleet Overview ({stats.total} units)</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search forklifts..."
            placeholderTextColor={COLORS.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'battery' && styles.sortButtonActive]}
            onPress={() => setSortBy('battery')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'battery' && styles.sortButtonTextActive]}>
              Battery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'activity' && styles.sortButtonActive]}
            onPress={() => setSortBy('activity')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'activity' && styles.sortButtonTextActive]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forklift List */}
      {filteredForklifts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No forklifts match your search' : 'No forklifts found'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredForklifts.map(item => (
            <View key={item._id}>
              {renderForklift({ item })}
            </View>
          ))}
        </View>
      )}

      {/* Bottom padding for scroll */}
      <View style={{ height: 20 }} />
    </ScrollView>
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
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'white',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  steraLogo: {
    width: 120,
    height: 40,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
    textAlign: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: SPACING.sm,
  },
  liveText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  connectionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.white,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.huge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  analyticsCard: {
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  analyticsCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  analyticsCardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  activityBar: {
    marginBottom: SPACING.md,
  },
  activityBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activityIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  activityName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  activityCount: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  activityBarTrack: {
    height: 28,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  activityBarFill: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: SPACING.sm,
  },
  activityPercentage: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  activitySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  batteryGaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  batteryGauge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  batteryGaugeValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  batteryGaugeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.white,
    marginTop: SPACING.xs,
  },
  batteryStatsGrid: {
    flex: 1,
    gap: SPACING.sm,
  },
  batteryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  batteryStatIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  batteryStatValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  batteryStatLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    flex: 1,
  },
  batteryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  batteryAlertIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  batteryAlertText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    flex: 1,
  },
  performanceMetrics: {
    gap: SPACING.lg,
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  performanceValue: {
    fontSize: TYPOGRAPHY.fontSize.huge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  utilizationBar: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  utilizationBarFill: {
    height: '100%',
  },
  performanceRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  performanceMetricSmall: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  performanceLabelSmall: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  performanceValueSmall: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  controlsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.tertiary,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sortButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
  },
  sortButtonTextActive: {
    color: COLORS.text.white,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
  },
  forkliftCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  forkliftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forkliftIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  forkliftIcon: {
    fontSize: 24,
  },
  forkliftDetails: {
    flex: 1,
  },
  forkliftName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  forkliftId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.lighter,
    marginTop: 2,
  },
  activityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  activityText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  cardBody: {
    padding: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  valueSmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    maxWidth: '60%',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  batteryBarBackground: {
    width: 80,
    height: 20,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  batteryBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  batteryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  cardFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  viewDetails: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: SPACING.huge,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  clearSearchText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
