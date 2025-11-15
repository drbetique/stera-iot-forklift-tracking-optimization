import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
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

  useEffect(() => {
    fetchData();
    checkConnection();

    const interval = setInterval(() => {
      fetchData();
      checkConnection();
    }, 10000);

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
      console.error('Failed to fetch forklifts:', error);
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
    idle: forklifts.filter(f => f.currentActivity === 'IDLE').length,
    avgBattery: forklifts.length > 0
      ? Math.round(forklifts.reduce((sum, f) => sum + (f.batteryLevel || 0), 0) / forklifts.length)
      : 0
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Stera IoT</Text>
            <Text style={styles.subtitle}>Fleet Management</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
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
          <Text style={styles.statLabel}>Total</Text>
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
      <FlatList
        data={filteredForklifts}
        renderItem={renderForklift}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
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
        }
      />
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.lighter,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginRight: SPACING.xs,
  },
  liveText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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
    padding: SPACING.lg,
    paddingTop: 0,
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
