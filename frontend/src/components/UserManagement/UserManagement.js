import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './UserManagement.css';

/**
 * UserManagement component
 * Admin-only interface for managing users (CRUD operations)
 * Features: Create, Edit, Activate/Deactivate, Delete users
 * Includes search/filter functionality and responsive design
 */
const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for creating new user
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'viewer'
  });

  // Form states for editing user
  const [editUser, setEditUser] = useState({
    fullName: '',
    email: '',
    role: 'viewer'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Check admin access
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch users on mount
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  /**
   * Fetch all users from the API
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter and search users
   */
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = filterRole === 'all' || user.role === filterRole;

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  /**
   * Validate create user form
   */
  const validateCreateForm = () => {
    const errors = {};

    if (!newUser.username.trim()) {
      errors.username = 'Username is required';
    } else if (newUser.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Invalid email format';
    }

    if (!newUser.password) {
      errors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!newUser.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate edit user form
   */
  const validateEditForm = () => {
    const errors = {};

    if (!editUser.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!editUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUser.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle create user
   */
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!validateCreateForm()) {
      return;
    }

    try {
      await api.createUser(newUser);
      setCreateModalOpen(false);
      resetCreateForm();
      fetchUsers();
      showSuccessMessage('User created successfully');
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to create user' });
    }
  };

  /**
   * Handle edit user
   */
  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    try {
      await api.updateUser(selectedUser._id, editUser);
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      showSuccessMessage('User updated successfully');
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to update user' });
    }
  };

  /**
   * Handle toggle user active status
   */
  const handleToggleActive = async (userId, username, currentStatus) => {
    if (userId === currentUser.id) {
      alert('You cannot deactivate your own account');
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${username}"?`)) {
      return;
    }

    try {
      await api.toggleUserActive(userId);
      fetchUsers();
      showSuccessMessage(`User ${action}d successfully`);
    } catch (err) {
      alert(err.message || `Failed to ${action} user`);
    }
  };

  /**
   * Handle delete user
   */
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.deleteUser(selectedUser._id);
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      showSuccessMessage('User deleted successfully');
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'viewer'
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  /**
   * Open delete modal
   */
  const openDeleteModal = (user) => {
    if (user._id === currentUser.id) {
      alert('You cannot delete your own account');
      return;
    }
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  /**
   * Reset create form
   */
  const resetCreateForm = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'viewer'
    });
    setFormErrors({});
  };

  /**
   * Show success message (simple implementation)
   */
  const showSuccessMessage = (message) => {
    // In a production app, you'd use a toast notification library
    console.log('Success:', message);
  };

  /**
   * Get user initials for avatar
   */
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#ef4444';
      case 'operator':
        return '#3b82f6';
      case 'viewer':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  /**
   * Format last login time
   */
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';

    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffMs = now - loginDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return loginDate.toLocaleDateString();
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="user-management-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-top">
          <button
            className="back-button"
            onClick={() => navigate('/')}
            aria-label="Back to dashboard"
          >
            <span className="back-icon">&larr;</span>
            Back to Dashboard
          </button>
          <div className="header-title-section">
            <h1 className="header-title">User Management</h1>
            <p className="header-subtitle">
              {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            className="btn-primary create-user-btn"
            onClick={() => setCreateModalOpen(true)}
            aria-label="Create new user"
          >
            <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create User
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* User List */}
      <div className="user-list-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <h3>No users found</h3>
            <p>Try adjusting your filters or create a new user</p>
          </div>
        ) : (
          <div className="user-grid">
            {filteredUsers.map(user => (
              <div
                key={user._id}
                className={`user-card ${!user.isActive ? 'user-card-inactive' : ''} ${user._id === currentUser.id ? 'user-card-current' : ''}`}
              >
                {/* User Card Header */}
                <div className="user-card-header">
                  <div className="user-avatar-large" style={{ backgroundColor: getRoleBadgeColor(user.role) }}>
                    {getInitials(user.fullName || user.username)}
                  </div>
                  <div className="user-card-info">
                    <div className="user-name-row">
                      <h3 className="user-card-name">{user.fullName || user.username}</h3>
                      {user._id === currentUser.id && (
                        <span className="current-user-badge">YOU</span>
                      )}
                    </div>
                    <p className="user-card-username">@{user.username}</p>
                    <p className="user-card-email">{user.email}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="user-card-details">
                  <div className="user-detail-row">
                    <span className="detail-label">Role:</span>
                    <span
                      className="role-badge"
                      style={{
                        backgroundColor: `${getRoleBadgeColor(user.role)}20`,
                        color: getRoleBadgeColor(user.role)
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="user-detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="user-detail-row">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">{formatLastLogin(user.lastLogin)}</span>
                  </div>

                  <div className="user-detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {user._id !== currentUser.id && (
                  <div className="user-card-actions">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => openEditModal(user)}
                      title="Edit user"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </button>

                    <button
                      className={`btn-action ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => handleToggleActive(user._id, user.username, user.isActive)}
                      title={user.isActive ? 'Deactivate user' : 'Activate user'}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        {user.isActive ? (
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      className="btn-action btn-delete"
                      onClick={() => openDeleteModal(user)}
                      title="Delete user"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createModalOpen && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button
                className="modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="create-username">
                  Username *
                </label>
                <input
                  id="create-username"
                  type="text"
                  className={`form-input ${formErrors.username ? 'form-input-error' : ''}`}
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                  autoComplete="off"
                />
                {formErrors.username && (
                  <span className="form-error">{formErrors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-email">
                  Email *
                </label>
                <input
                  id="create-email"
                  type="email"
                  className={`form-input ${formErrors.email ? 'form-input-error' : ''}`}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  autoComplete="off"
                />
                {formErrors.email && (
                  <span className="form-error">{formErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-password">
                  Password *
                </label>
                <input
                  id="create-password"
                  type="password"
                  className={`form-input ${formErrors.password ? 'form-input-error' : ''}`}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password (min. 6 characters)"
                  autoComplete="new-password"
                />
                {formErrors.password && (
                  <span className="form-error">{formErrors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-fullname">
                  Full Name *
                </label>
                <input
                  id="create-fullname"
                  type="text"
                  className={`form-input ${formErrors.fullName ? 'form-input-error' : ''}`}
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Enter full name"
                  autoComplete="off"
                />
                {formErrors.fullName && (
                  <span className="form-error">{formErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Role *</label>
                <div className="role-selector">
                  {['viewer', 'operator', 'admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      className={`role-option ${newUser.role === role ? 'role-option-active' : ''}`}
                      onClick={() => setNewUser({ ...newUser, role })}
                      style={{
                        borderColor: newUser.role === role ? getRoleBadgeColor(role) : undefined,
                        backgroundColor: newUser.role === role ? `${getRoleBadgeColor(role)}20` : undefined
                      }}
                    >
                      <span className="role-option-name">{role.toUpperCase()}</span>
                      <span className="role-option-desc">
                        {role === 'admin' && 'Full system access'}
                        {role === 'operator' && 'Manage fleet operations'}
                        {role === 'viewer' && 'View-only access'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {formErrors.submit && (
                <div className="form-error-banner">
                  {formErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-fullname">
                  Full Name *
                </label>
                <input
                  id="edit-fullname"
                  type="text"
                  className={`form-input ${formErrors.fullName ? 'form-input-error' : ''}`}
                  value={editUser.fullName}
                  onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
                {formErrors.fullName && (
                  <span className="form-error">{formErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">
                  Email *
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className={`form-input ${formErrors.email ? 'form-input-error' : ''}`}
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <span className="form-error">{formErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Role *</label>
                <div className="role-selector">
                  {['viewer', 'operator', 'admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      className={`role-option ${editUser.role === role ? 'role-option-active' : ''}`}
                      onClick={() => setEditUser({ ...editUser, role })}
                      disabled={selectedUser._id === currentUser.id && role !== 'admin'}
                      style={{
                        borderColor: editUser.role === role ? getRoleBadgeColor(role) : undefined,
                        backgroundColor: editUser.role === role ? `${getRoleBadgeColor(role)}20` : undefined
                      }}
                    >
                      <span className="role-option-name">{role.toUpperCase()}</span>
                      <span className="role-option-desc">
                        {role === 'admin' && 'Full system access'}
                        {role === 'operator' && 'Manage fleet operations'}
                        {role === 'viewer' && 'View-only access'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {formErrors.submit && (
                <div className="form-error-banner">
                  {formErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedUser && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="delete-warning-text">
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
              </p>
              <p className="delete-warning-subtext">
                This action cannot be undone. All user data will be permanently removed.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteUser}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;
