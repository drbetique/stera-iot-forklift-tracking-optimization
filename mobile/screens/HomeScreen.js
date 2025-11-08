import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');

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
      const response = await api.getAllForklifts();
      if (response.success) {
        setForklifts(response.data);
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

  const getActivityIcon = (activity) => {
    const icons = {
      'DRIVING': '🚗',
      'WORKING': '⚙️',
      'IDLE': '⏸️',
      'PARKED': '🅿️',
      'CHARGING': '🔋',
      'UNKNOWN': '❓'
    };
    return icons[activity] || icons.UNKNOWN;
  };

  const renderForklift = ({ item }) => (
    <TouchableOpacity
      style={styles.forkliftCard}
      onPress={() => navigation.navigate('Details', { forklift: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.forkliftInfo}>
          <Text style={styles.forkliftIcon}>🚜</Text>
          <View>
            <Text style={styles.forkliftName}>{item.name}</Text>
            <Text style={styles.forkliftId}>{item.forkliftId}</Text>
          </View>
        </View>
        <View style={[styles.activityBadge, { backgroundColor: getActivityColor(item.currentActivity) }]}>
          <Text style={styles.activityText}>
            {getActivityIcon(item.currentActivity)} {item.currentActivity}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Model:</Text>
          <Text style={styles.value}>{item.model || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Battery:</Text>
          <View style={styles.batteryContainer}>
            <View style={styles.batteryBar}>
              <View 
                style={[
                  styles.batteryFill, 
                  { 
                    width: `${item.batteryLevel || 0}%`,
                    backgroundColor: item.batteryLevel > 70 ? '#10b981' : item.batteryLevel > 40 ? '#f59e0b' : '#ef4444'
                  }
                ]} 
              />
            </View>
            <Text style={styles.batteryText}>{item.batteryLevel || 0}%</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#d1fae5' : '#fee2e2' }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading forklifts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🚜 Stera IoT</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={[styles.connectionStatus, { color: connectionStatus === 'Connected' ? '#10b981' : '#ef4444' }]}>
          {connectionStatus === 'Connected' ? '✓' : '✗'} {connectionStatus}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{forklifts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{forklifts.filter(f => f.currentActivity === 'WORKING' || f.currentActivity === 'DRIVING').length}</Text>
          <Text style={styles.statLabel}>Working</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{forklifts.filter(f => f.currentActivity === 'IDLE').length}</Text>
          <Text style={styles.statLabel}>Idle</Text>
        </View>
      </View>

      <FlatList
        data={forklifts}
        renderItem={renderForklift}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No forklifts found</Text>
          </View>
        }
      />
    </View>
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
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
  },
  forkliftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#667eea',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  forkliftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forkliftIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  forkliftName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  forkliftId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  activityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  batteryBar: {
    width: 80,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 10,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardFooter: {
    padding: 15,
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  viewDetails: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});