# 🎨 User Management API - Frontend Integration Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [API Client Setup](#api-client-setup)
3. [Authentication Flow](#authentication-flow)
4. [User Management Functions](#user-management-functions)
5. [React Components Examples](#react-components-examples)
6. [Error Handling](#error-handling)
7. [Complete Examples](#complete-examples)

---

## 🚀 Quick Start

### Base Configuration

```javascript
// config.js
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  USER_MANAGEMENT_URL: 'http://localhost:3000/api/user-management',
  APP_ID: 'default_app_id',
  SERVICE_KEY: 'default_service_key'
};
```

---

## 🔧 API Client Setup

### Complete API Client Class

```javascript
// services/UserManagementAPI.js

class UserManagementAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/user-management';
    this.authURL = 'http://localhost:3000/api/auth';
    this.token = localStorage.getItem('jwt_token') || '';
  }

  // Get headers with JWT token
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Get auth headers (for login)
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-App-Id': 'default_app_id',
      'X-Service-Key': 'default_service_key'
    };
  }

  // Set token after login
  setToken(token) {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  // Clear token on logout
  clearToken() {
    this.token = '';
    localStorage.removeItem('jwt_token');
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  async login(email, password) {
    const response = await fetch(`${this.authURL}/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  async verifyOTP(email, otpCode) {
    const response = await fetch(`${this.authURL}/verify-otp`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, otpCode })
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  // ==================== USER MANAGEMENT ====================

  // Get all users with pagination and filters
  async getAllUsers(params = {}) {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = params;
    const queryParams = new URLSearchParams({ page, limit, search, role, status });
    return this.request(`/users?${queryParams}`);
  }

  // Get user statistics
  async getStatistics() {
    return this.request('/statistics');
  }

  // Get single user by ID
  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  // Update user email and/or role
  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    return this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Activate user account
  async activateUser(userId) {
    return this.request(`/users/${userId}/activate`, {
      method: 'POST'
    });
  }

  // Deactivate user account
  async deactivateUser(userId, reason = '') {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Send password reset email
  async sendPasswordReset(userId) {
    return this.request(`/users/${userId}/send-password-reset`, {
      method: 'POST'
    });
  }

  // Delete user
  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export default new UserManagementAPI();
```

---

## 🔐 Authentication Flow

### Step-by-Step Login Process

```javascript
// Login Component Example
import UserManagementAPI from './services/UserManagementAPI';

async function handleLogin(email, password) {
  try {
    // Step 1: Send login request
    console.log('Sending login request...');
    const loginResponse = await UserManagementAPI.login(email, password);
    
    if (loginResponse.success) {
      console.log('OTP sent to email');
      
      // Step 2: Show OTP input to user
      const otpCode = prompt('Enter OTP code from your email:');
      
      // Step 3: Verify OTP
      const verifyResponse = await UserManagementAPI.verifyOTP(email, otpCode);
      
      if (verifyResponse.success) {
        console.log('Login successful!');
        console.log('User:', verifyResponse.user);
        
        // Token is automatically stored in localStorage
        // Now you can use User Management APIs
        return verifyResponse.user;
      }
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}
```

---

## 👥 User Management Functions

### 1. Get All Users with Pagination

```javascript
// Example: Get users with pagination
async function loadUsers(page = 1) {
  try {
    const response = await UserManagementAPI.getAllUsers({
      page: page,
      limit: 20
    });
    
    console.log('Users:', response.data.users);
    console.log('Total:', response.data.pagination.total);
    console.log('Pages:', response.data.pagination.totalPages);
    
    return response.data;
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}
```

### 2. Search Users

```javascript
// Example: Search users by email or name
async function searchUsers(searchTerm) {
  try {
    const response = await UserManagementAPI.getAllUsers({
      search: searchTerm,
      page: 1,
      limit: 10
    });
    
    console.log(`Found ${response.data.users.length} users`);
    return response.data.users;
  } catch (error) {
    console.error('Search failed:', error);
  }
}
```

### 3. Filter Users by Role

```javascript
// Example: Get all admin users
async function getAdminUsers() {
  try {
    const response = await UserManagementAPI.getAllUsers({
      role: 'admin',
      page: 1,
      limit: 50
    });
    
    return response.data.users;
  } catch (error) {
    console.error('Failed to get admin users:', error);
  }
}
```

### 4. Filter Users by Status

```javascript
// Example: Get all active users
async function getActiveUsers() {
  try {
    const response = await UserManagementAPI.getAllUsers({
      status: 'active',
      page: 1,
      limit: 100
    });
    
    return response.data.users;
  } catch (error) {
    console.error('Failed to get active users:', error);
  }
}
```

### 5. Get User Statistics

```javascript
// Example: Load dashboard statistics
async function loadDashboardStats() {
  try {
    const response = await UserManagementAPI.getStatistics();
    
    const stats = response.data;
    console.log('Total Users:', stats.overview.totalUsers);
    console.log('Active Users:', stats.overview.activeUsers);
    console.log('Inactive Users:', stats.overview.inactiveUsers);
    console.log('Recent Registrations:', stats.overview.recentRegistrations);
    console.log('Recent Active Logins:', stats.overview.recentActiveLogins);
    
    return stats;
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}
```

### 6. Update User Email

```javascript
// Example: Change user email
async function changeUserEmail(userId, newEmail) {
  try {
    const response = await UserManagementAPI.updateUser(userId, {
      email: newEmail
    });
    
    if (response.success) {
      console.log('Email updated successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to update email:', error);
  }
}
```

### 7. Update User Role

```javascript
// Example: Change user role to moderator
async function changeUserRole(userId, newRole) {
  try {
    const response = await UserManagementAPI.updateUser(userId, {
      role: newRole // 'admin', 'user', or 'moderator'
    });
    
    if (response.success) {
      console.log('Role updated successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to update role:', error);
  }
}
```

### 8. Update User Profile

```javascript
// Example: Update user profile information
async function updateProfile(userId, profileData) {
  try {
    const response = await UserManagementAPI.updateUserProfile(userId, {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      state: profileData.state,
      country: profileData.country,
      postal_code: profileData.postalCode
    });
    
    if (response.success) {
      console.log('Profile updated successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
}
```

### 9. Activate User

```javascript
// Example: Activate a user account
async function activateUserAccount(userId) {
  try {
    const response = await UserManagementAPI.activateUser(userId);
    
    if (response.success) {
      console.log('User activated successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to activate user:', error);
  }
}
```

### 10. Deactivate User

```javascript
// Example: Deactivate a user account
async function deactivateUserAccount(userId, reason) {
  try {
    const response = await UserManagementAPI.deactivateUser(userId, reason);
    
    if (response.success) {
      console.log('User deactivated successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to deactivate user:', error);
  }
}
```

### 11. Send Password Reset

```javascript
// Example: Send password reset email to user
async function sendPasswordResetEmail(userId) {
  try {
    const response = await UserManagementAPI.sendPasswordReset(userId);
    
    if (response.success) {
      console.log('Password reset email sent to:', response.data.email);
    }
    
    return response;
  } catch (error) {
    console.error('Failed to send password reset:', error);
  }
}
```

### 12. Delete User

```javascript
// Example: Delete a user account
async function deleteUserAccount(userId) {
  try {
    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
    
    if (!confirmed) return;
    
    const response = await UserManagementAPI.deleteUser(userId);
    
    if (response.success) {
      console.log('User deleted successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to delete user:', error);
  }
}
```

---

## ⚛️ React Components Examples

### 1. User Statistics Dashboard

```jsx
// components/UserStatistics.jsx
import React, { useState, useEffect } from 'react';
import UserManagementAPI from '../services/UserManagementAPI';

function UserStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await UserManagementAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading statistics...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="statistics-dashboard">
      <h2>User Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.overview.totalUsers}</h3>
          <p>Total Users</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.overview.activeUsers}</h3>
          <p>Active Users</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.overview.inactiveUsers}</h3>
          <p>Inactive Users</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.overview.recentRegistrations}</h3>
          <p>Recent Registrations (30d)</p>
        </div>
        
        <div className="stat-card">
          <h3>{stats.overview.recentActiveLogins}</h3>
          <p>Recent Active Logins (7d)</p>
        </div>
      </div>

      <div className="role-distribution">
        <h3>Users by Role</h3>
        {stats.roleDistribution.map(role => (
          <div key={role.role}>
            {role.role}: {role.count}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserStatistics;
```

### 2. User List with Pagination

```jsx
// components/UserList.jsx
import React, { useState, useEffect } from 'react';
import UserManagementAPI from '../services/UserManagementAPI';

function UserList() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await UserManagementAPI.getAllUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="user-list">
      <h2>User Management</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={handleSearch}
        />
        
        <select value={roleFilter} onChange={handleRoleFilter}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
        </select>
        
        <select value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.last_login || 'Never'}</td>
                  <td>
                    <button onClick={() => handleViewUser(user.id)}>View</button>
                    <button onClick={() => handleEditUser(user.id)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.page} of {pagination.totalPages} 
              ({pagination.total} total users)
            </span>
            
            <button 
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserList;
```

### 3. User Edit Form

```jsx
// components/UserEditForm.jsx
import React, { useState, useEffect } from 'react';
import UserManagementAPI from '../services/UserManagementAPI';

function UserEditForm({ userId, onClose, onSuccess }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await UserManagementAPI.getUserById(userId);
      setUser(response.data);
      
      // Populate form
      setFormData({
        email: response.data.email,
        role: response.data.role,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        country: response.data.country || '',
        postal_code: response.data.postal_code || ''
      });
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Update user (email and role)
      await UserManagementAPI.updateUser(userId, {
        email: formData.email,
        role: formData.role
      });
      
      // Update profile
      await UserManagementAPI.updateUserProfile(userId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code
      });
      
      alert('User updated successfully!');
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading user...</div>;

  return (
    <div className="user-edit-form">
      <h2>Edit User</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Account Information</h3>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Role:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Profile Information</h3>
          
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>City:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>State:</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Country:</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Postal Code:</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default UserEditForm;
```

### 4. User Actions Component

```jsx
// components/UserActions.jsx
import React from 'react';
import UserManagementAPI from '../services/UserManagementAPI';

function UserActions({ user, onActionComplete }) {
  const handleActivate = async () => {
    try {
      await UserManagementAPI.activateUser(user.id);
      alert('User activated successfully!');
      onActionComplete && onActionComplete();
    } catch (error) {
      alert('Failed to activate user: ' + error.message);
    }
  };

  const handleDeactivate = async () => {
    const reason = prompt('Enter reason for deactivation:');
    if (!reason) return;
    
    try {
      await UserManagementAPI.deactivateUser(user.id, reason);
      alert('User deactivated successfully!');
      onActionComplete && onActionComplete();
    } catch (error) {
      alert('Failed to deactivate user: ' + error.message);
    }
  };

  const handleSendPasswordReset = async () => {
    try {
      const response = await UserManagementAPI.sendPasswordReset(user.id);
      alert(`Password reset email sent to ${response.data.email}`);
    } catch (error) {
      alert('Failed to send password reset: ' + error.message);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete ${user.email}? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await UserManagementAPI.deleteUser(user.id);
      alert('User deleted successfully!');
      onActionComplete && onActionComplete();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  return (
    <div className="user-actions">
      {user.status === 'inactive' ? (
        <button onClick={handleActivate} className="btn-success">
          Activate
        </button>
      ) : (
        <button onClick={handleDeactivate} className="btn-warning">
          Deactivate
        </button>
      )}
      
      <button onClick={handleSendPasswordReset} className="btn-info">
        Send Password Reset
      </button>
      
      <button onClick={handleDelete} className="btn-danger">
        Delete User
      </button>
    </div>
  );
}

export default UserActions;
```

### 5. Complete User Management Page

```jsx
// pages/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import UserManagementAPI from '../services/UserManagementAPI';
import UserStatistics from '../components/UserStatistics';
import UserList from '../components/UserList';
import UserEditForm from '../components/UserEditForm';

function UserManagementPage() {
  const [view, setView] = useState('list'); // 'list', 'edit', 'statistics'
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleEditUser = (userId) => {
    setSelectedUserId(userId);
    setView('edit');
  };

  const handleCloseEdit = () => {
    setView('list');
    setSelectedUserId(null);
  };

  const handleEditSuccess = () => {
    setView('list');
    setSelectedUserId(null);
    // Refresh user list
  };

  return (
    <div className="user-management-page">
      <header>
        <h1>User Management</h1>
        
        <nav>
          <button 
            className={view === 'statistics' ? 'active' : ''}
            onClick={() => setView('statistics')}
          >
            Statistics
          </button>
          <button 
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            User List
          </button>
        </nav>
      </header>

      <main>
        {view === 'statistics' && <UserStatistics />}
        {view === 'list' && <UserList onEditUser={handleEditUser} />}
        {view === 'edit' && (
          <UserEditForm
            userId={selectedUserId}
            onClose={handleCloseEdit}
            onSuccess={handleEditSuccess}
          />
        )}
      </main>
    </div>
  );
}

export default UserManagementPage;
```

---

## 🎨 Vanilla JavaScript Example

### Complete HTML + JavaScript Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        h1 { color: #333; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card h2 { font-size: 36px; margin-bottom: 10px; }
        .stat-card p { font-size: 14px; opacity: 0.9; }
        .filters { display: flex; gap: 10px; margin: 20px 0; }
        .filters input, .filters select { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; }
        .status-badge.active { background: #d4edda; color: #155724; }
        .status-badge.inactive { background: #f8d7da; color: #721c24; }
        button { padding: 8px 16px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-info { background: #17a2b8; color: white; }
        button:hover { opacity: 0.9; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👥 User Management Dashboard</h1>
        
        <!-- Statistics Section -->
        <div id="statistics">
            <h2>Statistics</h2>
            <div class="stats-grid" id="statsGrid"></div>
        </div>

        <!-- Filters Section -->
        <div class="filters">
            <input type="text" id="searchInput" placeholder="Search by email or name...">
            <select id="roleFilter">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
            </select>
            <select id="statusFilter">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            <button class="btn-primary" onclick="loadUsers()">Search</button>
        </div>

        <!-- Users Table -->
        <div id="usersTable"></div>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000/api';
        let jwtToken = localStorage.getItem('jwt_token') || '';

        // Get headers with JWT
        function getHeaders() {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            };
        }

        // Load statistics
        async function loadStatistics() {
            try {
                const response = await fetch(`${API_BASE}/user-management/statistics`, {
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const stats = result.data.overview;
                    document.getElementById('statsGrid').innerHTML = `
                        <div class="stat-card">
                            <h2>${stats.totalUsers}</h2>
                            <p>Total Users</p>
                        </div>
                        <div class="stat-card">
                            <h2>${stats.activeUsers}</h2>
                            <p>Active Users</p>
                        </div>
                        <div class="stat-card">
                            <h2>${stats.inactiveUsers}</h2>
                            <p>Inactive Users</p>
                        </div>
                        <div class="stat-card">
                            <h2>${stats.recentRegistrations}</h2>
                            <p>Recent Registrations</p>
                        </div>
                        <div class="stat-card">
                            <h2>${stats.recentActiveLogins}</h2>
                            <p>Recent Active Logins</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Failed to load statistics:', error);
            }
        }

        // Load users
        async function loadUsers(page = 1) {
            try {
                const search = document.getElementById('searchInput').value;
                const role = document.getElementById('roleFilter').value;
                const status = document.getElementById('statusFilter').value;
                
                const params = new URLSearchParams({ page, limit: 20, search, role, status });
                
                const response = await fetch(`${API_BASE}/user-management/users?${params}`, {
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displayUsers(result.data.users, result.data.pagination);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }

        // Display users in table
        function displayUsers(users, pagination) {
            const tableHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.email}</td>
                                <td>${user.first_name || ''} ${user.last_name || ''}</td>
                                <td>${user.role}</td>
                                <td><span class="status-badge ${user.status}">${user.status}</span></td>
                                <td>${user.last_login || 'Never'}</td>
                                <td>
                                    ${user.status === 'inactive' 
                                        ? `<button class="btn-success" onclick="activateUser(${user.id})">Activate</button>`
                                        : `<button class="btn-warning" onclick="deactivateUser(${user.id})">Deactivate</button>`
                                    }
                                    <button class="btn-info" onclick="sendPasswordReset(${user.id})">Reset Password</button>
                                    <button class="btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 20px; text-align: center;">
                    <button ${pagination.page === 1 ? 'disabled' : ''} onclick="loadUsers(${pagination.page - 1})">Previous</button>
                    <span style="margin: 0 20px;">Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total)</span>
                    <button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="loadUsers(${pagination.page + 1})">Next</button>
                </div>
            `;
            
            document.getElementById('usersTable').innerHTML = tableHTML;
        }

        // Activate user
        async function activateUser(userId) {
            try {
                const response = await fetch(`${API_BASE}/user-management/users/${userId}/activate`, {
                    method: 'POST',
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('User activated successfully!');
                    loadUsers();
                    loadStatistics();
                }
            } catch (error) {
                alert('Failed to activate user: ' + error.message);
            }
        }

        // Deactivate user
        async function deactivateUser(userId) {
            const reason = prompt('Enter reason for deactivation:');
            if (!reason) return;
            
            try {
                const response = await fetch(`${API_BASE}/user-management/users/${userId}/deactivate`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ reason })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('User deactivated successfully!');
                    loadUsers();
                    loadStatistics();
                }
            } catch (error) {
                alert('Failed to deactivate user: ' + error.message);
            }
        }

        // Send password reset
        async function sendPasswordReset(userId) {
            try {
                const response = await fetch(`${API_BASE}/user-management/users/${userId}/send-password-reset`, {
                    method: 'POST',
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`Password reset email sent to ${result.data.email}`);
                }
            } catch (error) {
                alert('Failed to send password reset: ' + error.message);
            }
        }

        // Delete user
        async function deleteUser(userId) {
            const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
            if (!confirmed) return;
            
            try {
                const response = await fetch(`${API_BASE}/user-management/users/${userId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('User deleted successfully!');
                    loadUsers();
                    loadStatistics();
                }
            } catch (error) {
                alert('Failed to delete user: ' + error.message);
            }
        }

        // Initialize page
        window.onload = function() {
            // Check if user is logged in
            if (!jwtToken) {
                alert('Please login first');
                // Redirect to login page or show login form
                return;
            }
            
            loadStatistics();
            loadUsers();
        };
    </script>
</body>
</html>
```

---

## 🔄 Error Handling

### Comprehensive Error Handler

```javascript
// utils/errorHandler.js

export function handleAPIError(error) {
  // Token expired or invalid
  if (error.message.includes('token') || error.message.includes('Unauthorized')) {
    alert('Your session has expired. Please login again.');
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
    return;
  }

  // Forbidden (not admin)
  if (error.message.includes('Forbidden') || error.message.includes('admin')) {
    alert('You do not have permission to perform this action.');
    return;
  }

  // User not found
  if (error.message.includes('not found')) {
    alert('User not found.');
    return;
  }

  // Duplicate email
  if (error.message.includes('already exists')) {
    alert('This email address is already in use.');
    return;
  }

  // Generic error
  alert('An error occurred: ' + error.message);
}

// Usage in your code:
try {
  await UserManagementAPI.updateUser(userId, data);
} catch (error) {
  handleAPIError(error);
}
```

---

## 📱 Mobile-Friendly Example (React Native)

```javascript
// services/UserManagementAPI.js (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';

class UserManagementAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/user-management';
    this.token = '';
  }

  async init() {
    this.token = await AsyncStorage.getItem('jwt_token') || '';
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('jwt_token', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async getAllUsers(params = {}) {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = params;
    const queryParams = new URLSearchParams({ page, limit, search, role, status });
    
    const response = await fetch(`${this.baseURL}/users?${queryParams}`, {
      headers: this.getHeaders()
    });
    
    return response.json();
  }

  // ... other methods same as web version
}

export default new UserManagementAPI();
```

---

## ✅ Testing Checklist for Frontend

Before deploying to production, test these scenarios:

### User List:
- [ ] Load users with pagination
- [ ] Search by email
- [ ] Search by name
- [ ] Filter by role (admin, user, moderator)
- [ ] Filter by status (active, inactive)
- [ ] Navigate between pages

### User Details:
- [ ] View single user details
- [ ] Display all profile information
- [ ] Show user status correctly

### User Updates:
- [ ] Update user email
- [ ] Update user role
- [ ] Update first name
- [ ] Update last name
- [ ] Update phone number
- [ ] Update address fields

### User Actions:
- [ ] Activate inactive user
- [ ] Deactivate active user
- [ ] Send password reset email
- [ ] Delete user (with confirmation)
- [ ] Prevent self-deletion

### Statistics:
- [ ] Display total users
- [ ] Display active users
- [ ] Display inactive users
- [ ] Display recent registrations
- [ ] Display recent logins
- [ ] Display role distribution

### Error Handling:
- [ ] Handle expired token
- [ ] Handle unauthorized access
- [ ] Handle user not found
- [ ] Handle duplicate email
- [ ] Handle network errors

---

## 🎉 Ready-to-Use Files

I've created these files for you:

1. **`services/UserManagementAPI.js`** - Copy this to your frontend project
2. **`components/UserStatistics.jsx`** - React component for statistics
3. **`components/UserList.jsx`** - React component for user list
4. **`components/UserEditForm.jsx`** - React component for editing
5. **`components/UserActions.jsx`** - React component for actions
6. **`user-management.html`** - Vanilla JS complete example

---

## 📞 Support

**Backend API Base URL:** `http://localhost:3000/api/user-management`

**Required Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

**Admin Login:**
- Email: `niroshmax01@gmail.com`
- Password: `Nir@2000313`
- Role: `admin` ✅

---

**All APIs are tested and ready for frontend integration!** 🚀
