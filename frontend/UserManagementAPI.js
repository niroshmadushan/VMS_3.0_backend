/**
 * User Management API Client
 * Ready-to-use JavaScript class for frontend integration
 * 
 * Usage:
 * 1. Copy this file to your frontend project
 * 2. Import: import UserManagementAPI from './UserManagementAPI';
 * 3. Use the methods to interact with the backend
 */

class UserManagementAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/user-management';
    this.authURL = 'http://localhost:3000/api/auth';
    this.token = localStorage.getItem('jwt_token') || '';
    this.appId = 'default_app_id';
    this.serviceKey = 'default_service_key';
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get headers with JWT token for authenticated requests
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Get headers for authentication endpoints
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-App-Id': this.appId,
      'X-Service-Key': this.serviceKey
    };
  }

  /**
   * Set JWT token after login
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  /**
   * Clear token on logout
   */
  clearToken() {
    this.token = '';
    localStorage.removeItem('jwt_token');
  }

  /**
   * Make authenticated request
   */
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

  /**
   * Login - Step 1: Send credentials and receive OTP
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Response with OTP sent status
   */
  async login(email, password) {
    const response = await fetch(`${this.authURL}/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  /**
   * Login - Step 2: Verify OTP and get JWT token
   * @param {string} email - User email
   * @param {string} otpCode - OTP code from email
   * @returns {Promise} Response with JWT token
   */
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

  /**
   * Logout
   */
  async logout() {
    try {
      await fetch(`${this.authURL}/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Results per page (default: 20)
   * @param {string} params.search - Search by email, first name, or last name
   * @param {string} params.role - Filter by role (admin, user, moderator)
   * @param {string} params.status - Filter by status (active, inactive)
   * @returns {Promise} Response with users array and pagination info
   */
  async getAllUsers(params = {}) {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = params;
    const queryParams = new URLSearchParams({ page, limit, search, role, status });
    return this.request(`/users?${queryParams}`);
  }

  /**
   * Get user statistics and analytics
   * @returns {Promise} Response with statistics data
   */
  async getStatistics() {
    return this.request('/statistics');
  }

  /**
   * Get single user by ID
   * @param {number} userId - User ID
   * @returns {Promise} Response with user details
   */
  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  /**
   * Update user email and/or role
   * @param {number} userId - User ID
   * @param {Object} data - Update data
   * @param {string} data.email - New email address
   * @param {string} data.role - New role (admin, user, moderator)
   * @returns {Promise} Response with success status
   */
  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update user profile information
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response with success status
   */
  async updateUserProfile(userId, profileData) {
    return this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Activate user account (verify email and unlock)
   * @param {number} userId - User ID
   * @returns {Promise} Response with success status
   */
  async activateUser(userId) {
    return this.request(`/users/${userId}/activate`, {
      method: 'POST'
    });
  }

  /**
   * Deactivate user account (lock account)
   * @param {number} userId - User ID
   * @param {string} reason - Reason for deactivation
   * @returns {Promise} Response with success status
   */
  async deactivateUser(userId, reason = '') {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Send password reset email to user
   * @param {number} userId - User ID
   * @returns {Promise} Response with success status
   */
  async sendPasswordReset(userId) {
    return this.request(`/users/${userId}/send-password-reset`, {
      method: 'POST'
    });
  }

  /**
   * Delete user account (hard delete)
   * @param {number} userId - User ID
   * @returns {Promise} Response with success status
   */
  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
const userManagementAPI = new UserManagementAPI();

// For ES6 modules
export default userManagementAPI;

// For CommonJS
// module.exports = userManagementAPI;



