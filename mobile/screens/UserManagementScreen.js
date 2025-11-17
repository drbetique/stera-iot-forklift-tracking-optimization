import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { formatRelativeTime } from '../utils/formatters';

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for creating new user
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // Form states for editing user
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('viewer');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert('Validation Error', 'Username, email, and password are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await api.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        fullName: newFullName.trim() || newUsername.trim(),
        role: newRole,
      });

      Alert.alert('Success', 'User created successfully', [
        { text: 'OK', onPress: () => {} }
      ]);
      setModalVisible(false);
      resetNewUserForm();
      fetchUsers();
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to create user'
      );
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (!editFullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    try {
      await api.updateUser(selectedUser._id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        role: editRole,
      });

      Alert.alert('Success', 'User updated successfully', [
        { text: 'OK', onPress: () => {} }
      ]);
      setEditModalVisible(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to update user'
      );
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.toggleUserActive(userId);
      Alert.alert(
        'Success',
        `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        [{ text: 'OK', onPress: () => {} }]
      );
      fetchUsers();
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to toggle user status'
      );
    }
  };

  const handleDeleteUser = (userId, username) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully', [
                { text: 'OK', onPress: () => {} }
              ]);
              fetchUsers();
            } catch (error) {
              Alert.alert(
                'Error',
                error.response?.data?.message || error.message || 'Failed to delete user'
              );
            }
          },
        },
      ]
    );
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFullName(user.fullName || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'viewer');
    setEditModalVisible(true);
  };

  const resetNewUserForm = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewFullName('');
    setNewRole('viewer');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return COLORS.error;
      case 'operator':
        return COLORS.warning;
      case 'viewer':
        return COLORS.info;
      default:
        return COLORS.text.tertiary;
    }
  };

  const getRoleLabel = (role) => {
    return role.toUpperCase();
  };

  const renderUser = ({ item }) => {
    const isCurrentUser = item._id === currentUser?.id;

    return (
      <View style={[
        styles.userCard,
        !item.isActive && styles.userCardInactive,
      ]}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.fullName || item.username}</Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={styles.userUsername}>@{item.username}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Role:</Text>
            <View style={[
              styles.roleBadge,
              { backgroundColor: getRoleBadgeColor(item.role) + '20' },
            ]}>
              <Text style={[
                styles.roleBadgeText,
                { color: getRoleBadgeColor(item.role) },
              ]}>
                {getRoleLabel(item.role)}
              </Text>
            </View>
          </View>

          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive
                  ? COLORS.success + '20'
                  : COLORS.error + '20',
              },
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: item.isActive ? COLORS.success : COLORS.error },
              ]}>
                {item.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          {item.lastLogin && (
            <View style={styles.userDetailRow}>
              <Text style={styles.userDetailLabel}>Last Login:</Text>
              <Text style={styles.userDetailValue}>
                {formatRelativeTime(item.lastLogin)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Disabled for current user */}
        {!isCurrentUser && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.actionButtonText}>✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                item.isActive ? styles.deactivateButton : styles.activateButton,
              ]}
              onPress={() => handleToggleActive(item._id, item.isActive)}
            >
              <Text style={styles.actionButtonText}>
                {item.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteUser(item._id, item.username)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                🗑️ Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noAccessIcon}>🔒</Text>
        <Text style={styles.noAccessText}>Access Denied</Text>
        <Text style={styles.noAccessSubtext}>
          Only administrators can access user management
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>
          {users.length} user{users.length !== 1 ? 's' : ''} total
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add New User</Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      {users.length === 0 ? (
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
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No users found</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
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

      {/* Create User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetNewUserForm();
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Username *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Enter username"
                  placeholderTextColor={COLORS.text.tertiary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter email"
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Password *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.text.tertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newFullName}
                  onChangeText={setNewFullName}
                  placeholder="Enter full name (optional)"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role *</Text>
                <View style={styles.roleButtons}>
                  {['admin', 'operator', 'viewer'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        newRole === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setNewRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          newRole === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {getRoleLabel(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateUser}
              >
                <Text style={styles.submitButtonText}>Create User</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter full name"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Enter email"
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <View style={styles.roleButtons}>
                  {['admin', 'operator', 'viewer'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        editRole === role && styles.roleButtonActive,
                      ]}
                      onPress={() => setEditRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          editRole === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {getRoleLabel(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEditUser}
              >
                <Text style={styles.submitButtonText}>Update User</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  noAccessIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  noAccessText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  noAccessSubtext: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  header: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.text.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  listContainer: {
    padding: SPACING.lg,
  },
  userCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  userCardInactive: {
    opacity: 0.6,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  userAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  youBadge: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  youBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  userUsername: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.tertiary,
  },
  userDetails: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    marginBottom: SPACING.md,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginRight: SPACING.sm,
    width: 80,
  },
  userDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  userActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.info + '20',
  },
  activateButton: {
    backgroundColor: COLORS.success + '20',
  },
  deactivateButton: {
    backgroundColor: COLORS.warning + '20',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  deleteButtonText: {
    color: COLORS.error,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  modalClose: {
    fontSize: 28,
    color: COLORS.text.secondary,
    padding: SPACING.xs,
  },
  modalScroll: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  formInput: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.secondary,
  },
  roleButtonTextActive: {
    color: COLORS.text.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.white,
  },
});
