/**
 * 🏢 PLACE MANAGEMENT SYSTEM - FRONTEND API CLIENT
 * 
 * Complete JavaScript client for integrating with the Place Management System
 * using the Secure SELECT API with JWT authentication.
 * 
 * Usage:
 * 1. Import this file into your frontend project
 * 2. Initialize with your backend URL
 * 3. Login to get JWT token
 * 4. Use API methods to access place management data
 * 
 * @author Your Backend System
 * @version 1.0.0
 */

class TokenManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.userRole = localStorage.getItem('user_role');
        this.userId = localStorage.getItem('user_id');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    // Get current JWT token
    getToken() {
        return this.token;
    }

    // Get user role from token
    getUserRole() {
        return this.userRole;
    }

    // Get user ID from token
    getUserId() {
        return this.userId;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.token && this.userRole && this.userId;
    }

    // Set new authentication data
    setToken(token, userRole, userId, refreshToken = null) {
        this.token = token;
        this.userRole = userRole;
        this.userId = userId;
        this.refreshToken = refreshToken;

        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', userId);
        
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
    }

    // Clear all authentication data (logout)
    clearToken() {
        this.token = null;
        this.userRole = null;
        this.userId = null;
        this.refreshToken = null;

        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('refresh_token');
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userRole === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        return roles.includes(this.userRole);
    }
}

class PlaceManagementAPI {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.apiURL = `${baseURL}/api`;
        this.secureSelectURL = `${this.apiURL}/secure-select`;
        this.authURL = `${this.apiURL}/auth`;
        this.tokenManager = new TokenManager();
    }

    // ========================================
    // AUTHENTICATION METHODS
    // ========================================

    /**
     * Login user and get JWT token
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login response with token and user data
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.authURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                this.tokenManager.setToken(
                    data.token,
                    data.user.role,
                    data.user.id,
                    data.refreshToken
                );

                return {
                    success: true,
                    token: data.token,
                    user: data.user,
                    refreshToken: data.refreshToken
                };
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Logout user and clear tokens
     * @returns {Promise<Object>} Logout response
     */
    async logout() {
        try {
            const token = this.tokenManager.getToken();
            if (token) {
                await fetch(`${this.authURL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            this.tokenManager.clearToken();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            this.tokenManager.clearToken(); // Clear anyway
            return { success: true }; // Return success even if API call fails
        }
    }

    /**
     * Validate current JWT token
     * @returns {Promise<Object>} Token validation response
     */
    async validateToken() {
        try {
            const token = this.tokenManager.getToken();
            if (!token) {
                return { success: false, error: 'No token found' };
            }

            const response = await fetch(`${this.authURL}/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Token validation error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // SECURE SELECT API METHODS
    // ========================================

    /**
     * Get headers with JWT token for authenticated requests
     * @returns {Object} Headers object with authorization
     */
    getHeaders() {
        const token = this.tokenManager.getToken();
        if (!token) {
            throw new Error('No authentication token found. Please login first.');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.secureSelectURL}${endpoint}`;
            const headers = this.getHeaders();

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.tokenManager.clearToken();
                    throw new Error('Authentication failed. Please login again.');
                }
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    /**
     * Get list of tables accessible to current user role
     * @returns {Promise<Object>} Allowed tables and permissions
     */
    async getAllowedTables() {
        try {
            const response = await this.makeRequest('/tables');
            return response.data;
        } catch (error) {
            console.error('Failed to get allowed tables:', error);
            throw error;
        }
    }

    /**
     * Get table schema and column information
     * @param {string} tableName - Name of the table
     * @returns {Promise<Object>} Table schema and column info
     */
    async getTableInfo(tableName) {
        try {
            const response = await this.makeRequest(`/${tableName}/info`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get info for table ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Get data from a table with optional filtering and pagination
     * @param {string} tableName - Name of the table
     * @param {Object} options - Query options (limit, page, filters, etc.)
     * @returns {Promise<Object>} Table data with metadata
     */
    async getTableData(tableName, options = {}) {
        try {
            const params = {
                limit: options.limit || 20,
                page: options.page || 1,
                ...options
            };

            // Convert filters to JSON string if provided
            if (params.filters && typeof params.filters === 'object') {
                params.filters = JSON.stringify(params.filters);
            }

            const response = await this.makeRequest(`/${tableName}`, { method: 'GET' });
            
            // Add query parameters to URL
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `/${tableName}?${queryString}` : `/${tableName}`;
            
            return this.makeRequest(url);
        } catch (error) {
            console.error(`Failed to get data from ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Perform advanced search on a specific table
     * @param {string} tableName - Name of the table
     * @param {Array} filters - Array of filter objects
     * @param {Object} options - Additional options (select, order, pagination)
     * @returns {Promise<Object>} Search results with metadata
     */
    async advancedSearch(tableName, filters, options = {}) {
        try {
            const searchData = {
                filters: filters,
                ...options
            };

            const response = await this.makeRequest(`/${tableName}/search`, {
                method: 'POST',
                body: JSON.stringify(searchData)
            });

            return response.data;
        } catch (error) {
            console.error(`Advanced search failed for ${tableName}:`, error);
            throw error;
        }
    }

    /**
     * Perform global search across all allowed tables
     * @param {string} searchTerm - Search term
     * @param {Array} searchColumns - Optional array of columns to search in
     * @returns {Promise<Object>} Global search results
     */
    async globalSearch(searchTerm, searchColumns = []) {
        try {
            const searchData = {
                searchTerm: searchTerm,
                searchColumns: searchColumns
            };

            const response = await this.makeRequest('/search', {
                method: 'POST',
                body: JSON.stringify(searchData)
            });

            return response.data;
        } catch (error) {
            console.error('Global search failed:', error);
            throw error;
        }
    }

    /**
     * Get filter capabilities for current user role
     * @returns {Promise<Object>} Available filter types and operators
     */
    async getFilterCapabilities() {
        try {
            const response = await this.makeRequest('/capabilities');
            return response.data;
        } catch (error) {
            console.error('Failed to get filter capabilities:', error);
            throw error;
        }
    }

    // ========================================
    // PLACE MANAGEMENT SPECIFIC METHODS
    // ========================================

    /**
     * Get all places with optional filtering
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Places data
     */
    async getPlaces(filters = {}, pagination = {}) {
        const queryOptions = {
            limit: pagination.limit || 20,
            page: pagination.page || 1,
            ...pagination
        };

        if (Object.keys(filters).length > 0) {
            queryOptions.filters = this.buildFilters(filters);
        }

        return this.getTableData('places', queryOptions);
    }

    /**
     * Get active places only
     * @returns {Promise<Object>} Active places data
     */
    async getActivePlaces() {
        const filters = [{
            column: 'is_active',
            operator: 'is_true',
            value: true
        }];

        return this.advancedSearch('places', filters);
    }

    /**
     * Get places by city
     * @param {string} city - City name
     * @returns {Promise<Object>} Places in specified city
     */
    async getPlacesByCity(city) {
        const filters = [{
            column: 'city',
            operator: 'equals',
            value: city
        }];

        return this.advancedSearch('places', filters);
    }

    /**
     * Get places by type
     * @param {string} placeType - Place type (office, warehouse, etc.)
     * @returns {Promise<Object>} Places of specified type
     */
    async getPlacesByType(placeType) {
        const filters = [{
            column: 'place_type',
            operator: 'equals',
            value: placeType
        }];

        return this.advancedSearch('places', filters);
    }

    /**
     * Get all visitors with optional filtering
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Visitors data
     */
    async getVisitors(filters = {}, pagination = {}) {
        const queryOptions = {
            limit: pagination.limit || 20,
            page: pagination.page || 1,
            ...pagination
        };

        if (Object.keys(filters).length > 0) {
            queryOptions.filters = this.buildFilters(filters);
        }

        return this.getTableData('visitors', queryOptions);
    }

    /**
     * Search visitors by name
     * @param {string} searchTerm - Name to search for
     * @returns {Promise<Object>} Matching visitors
     */
    async searchVisitorsByName(searchTerm) {
        const filters = [{
            column: 'first_name',
            operator: 'contains',
            value: searchTerm
        }];

        return this.advancedSearch('visitors', filters);
    }

    /**
     * Get blacklisted visitors
     * @returns {Promise<Object>} Blacklisted visitors
     */
    async getBlacklistedVisitors() {
        const filters = [{
            column: 'is_blacklisted',
            operator: 'is_true',
            value: true
        }];

        return this.advancedSearch('visitors', filters);
    }

    /**
     * Get all visits with optional filtering
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Visits data
     */
    async getVisits(filters = {}, pagination = {}) {
        const queryOptions = {
            limit: pagination.limit || 20,
            page: pagination.page || 1,
            ...pagination
        };

        if (Object.keys(filters).length > 0) {
            queryOptions.filters = this.buildFilters(filters);
        }

        return this.getTableData('visits', queryOptions);
    }

    /**
     * Get visits by date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Visits in date range
     */
    async getVisitsByDateRange(startDate, endDate) {
        const filters = [{
            column: 'scheduled_start_time',
            operator: 'date_between',
            value: [startDate, endDate]
        }];

        return this.advancedSearch('visits', filters);
    }

    /**
     * Get today's visits
     * @returns {Promise<Object>} Today's visits
     */
    async getTodaysVisits() {
        const today = new Date().toISOString().split('T')[0];
        return this.getVisitsByDateRange(today, today);
    }

    /**
     * Get visits by status
     * @param {string} status - Visit status (scheduled, in_progress, completed, etc.)
     * @returns {Promise<Object>} Visits with specified status
     */
    async getVisitsByStatus(status) {
        const filters = [{
            column: 'visit_status',
            operator: 'equals',
            value: status
        }];

        return this.advancedSearch('visits', filters);
    }

    /**
     * Get today's visits (using the view)
     * @returns {Promise<Object>} Today's visits from view
     */
    async getTodaysVisitsView() {
        return this.getTableData('todays_visits');
    }

    /**
     * Get place access logs
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Access logs data
     */
    async getPlaceAccessLogs(filters = {}, pagination = {}) {
        const queryOptions = {
            limit: pagination.limit || 20,
            page: pagination.page || 1,
            ...pagination
        };

        if (Object.keys(filters).length > 0) {
            queryOptions.filters = this.buildFilters(filters);
        }

        return this.getTableData('place_access_logs', queryOptions);
    }

    /**
     * Get place notifications
     * @param {Object} filters - Filter options
     * @param {Object} pagination - Pagination options
     * @returns {Promise<Object>} Notifications data
     */
    async getPlaceNotifications(filters = {}, pagination = {}) {
        const queryOptions = {
            limit: pagination.limit || 20,
            page: pagination.page || 1,
            ...pagination
        };

        if (Object.keys(filters).length > 0) {
            queryOptions.filters = this.buildFilters(filters);
        }

        return this.getTableData('place_notifications', queryOptions);
    }

    /**
     * Get place statistics
     * @param {string} placeId - Optional place ID to filter by
     * @returns {Promise<Object>} Place statistics
     */
    async getPlaceStatistics(placeId = null) {
        let filters = [];
        
        if (placeId) {
            filters = [{
                column: 'place_id',
                operator: 'equals',
                value: placeId
            }];
        }

        if (filters.length > 0) {
            return this.advancedSearch('place_statistics', filters);
        } else {
            return this.getTableData('place_statistics');
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Build filter array from simple filter object
     * @param {Object} filters - Simple filter object
     * @returns {Array} Filter array for API
     */
    buildFilters(filters) {
        const filterArray = [];

        for (const [column, value] of Object.entries(filters)) {
            if (value !== null && value !== undefined && value !== '') {
                let operator = 'equals';
                
                // Determine operator based on value type
                if (typeof value === 'boolean') {
                    operator = value ? 'is_true' : 'is_false';
                } else if (Array.isArray(value)) {
                    operator = 'in';
                } else if (typeof value === 'string' && value.includes('%')) {
                    operator = 'like';
                }

                filterArray.push({
                    column: column,
                    operator: operator,
                    value: value
                });
            }
        }

        return filterArray;
    }

    /**
     * Check if current user can access a specific table
     * @param {string} tableName - Name of the table
     * @returns {Promise<boolean>} Whether user can access the table
     */
    async canAccessTable(tableName) {
        try {
            const allowedTables = await this.getAllowedTables();
            return allowedTables.allowedTables.includes(tableName);
        } catch (error) {
            console.error('Failed to check table access:', error);
            return false;
        }
    }

    /**
     * Check if current user has specific role
     * @param {string} role - Role to check
     * @returns {boolean} Whether user has the role
     */
    hasRole(role) {
        return this.tokenManager.hasRole(role);
    }

    /**
     * Check if current user has any of the specified roles
     * @param {Array} roles - Array of roles to check
     * @returns {boolean} Whether user has any of the roles
     */
    hasAnyRole(roles) {
        return this.tokenManager.hasAnyRole(roles);
    }

    /**
     * Get current user information
     * @returns {Object} Current user data
     */
    getCurrentUser() {
        return {
            id: this.tokenManager.getUserId(),
            role: this.tokenManager.getUserRole(),
            isAuthenticated: this.tokenManager.isAuthenticated()
        };
    }
}

// ========================================
// EXPORT FOR USE IN FRONTEND
// ========================================

// For ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlaceManagementAPI, TokenManager };
}

// For browser global usage
if (typeof window !== 'undefined') {
    window.PlaceManagementAPI = PlaceManagementAPI;
    window.TokenManager = TokenManager;
}

// ========================================
// USAGE EXAMPLES
// ========================================

/**
 * BASIC USAGE EXAMPLE:
 * 
 * // Initialize API client
 * const api = new PlaceManagementAPI('http://localhost:3000');
 * 
 * // Login
 * const loginResult = await api.login('user@example.com', 'password');
 * if (loginResult.success) {
 *     console.log('Logged in successfully');
 * }
 * 
 * // Get places
 * const places = await api.getPlaces();
 * console.log('Places:', places.data);
 * 
 * // Search visitors
 * const visitors = await api.searchVisitorsByName('John');
 * console.log('Visitors:', visitors.data);
 * 
 * // Get today's visits
 * const todaysVisits = await api.getTodaysVisits();
 * console.log('Today\'s visits:', todaysVisits.data);
 * 
 * // Advanced filtering
 * const filteredPlaces = await api.advancedSearch('places', [
 *     {
 *         column: 'city',
 *         operator: 'equals',
 *         value: 'New York'
 *     },
 *     {
 *         column: 'is_active',
 *         operator: 'is_true',
 *         value: true
 *     }
 * ]);
 * 
 * // Logout
 * await api.logout();
 */
