# 🏢 PLACE MANAGEMENT SYSTEM - FRONTEND INTEGRATION GUIDE

## 📋 **Overview**

Complete guide for frontend developers to integrate with the Place Management System using the Secure SELECT API. This guide covers authentication, JWT handling, API calls, and real-world examples.

---

## 🔐 **Authentication & JWT Setup**

### **1. Login to Get JWT Token**

```javascript
// Login to get JWT token
const loginUser = async (email, password) => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
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
            // Store JWT token securely
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_id', data.user.id);
            
            return {
                success: true,
                token: data.token,
                user: data.user
            };
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Login failed:', error);
        return { success: false, error: error.message };
    }
};
```

### **2. JWT Token Storage & Management**

```javascript
// JWT Token Manager
class TokenManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.userRole = localStorage.getItem('user_role');
        this.userId = localStorage.getItem('user_id');
    }

    // Get current token
    getToken() {
        return this.token;
    }

    // Get user role
    getUserRole() {
        return this.userRole;
    }

    // Get user ID
    getUserId() {
        return this.userId;
    }

    // Check if token exists and is valid
    isAuthenticated() {
        return this.token && this.userRole && this.userId;
    }

    // Clear stored data (logout)
    clearToken() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_id');
        this.token = null;
        this.userRole = null;
        this.userId = null;
    }

    // Set new token
    setToken(token, userRole, userId) {
        this.token = token;
        this.userRole = userRole;
        this.userId = userId;
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', userId);
    }
}

// Initialize token manager
const tokenManager = new TokenManager();
```

---

## 🚀 **API Client Setup**

### **Base API Client**

```javascript
// Secure API Client for Place Management
class PlaceManagementAPI {
    constructor(baseURL = 'http://localhost:3000/api/secure-select') {
        this.baseURL = baseURL;
        this.tokenManager = new TokenManager();
    }

    // Get headers with JWT token
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

    // Make authenticated request
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
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

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.makeRequest(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Initialize API client
const placeAPI = new PlaceManagementAPI();
```

---

## 📊 **Place Management API Methods**

### **1. Get Allowed Tables**

```javascript
// Get tables accessible to current user role
const getAllowedTables = async () => {
    try {
        const response = await placeAPI.get('/tables');
        return response.data;
    } catch (error) {
        console.error('Failed to get allowed tables:', error);
        throw error;
    }
};

// Usage example
const tables = await getAllowedTables();
console.log('Available tables:', tables.allowedTables);
console.log('User role:', tables.role);
console.log('Filter capabilities:', tables.permissions);
```

### **2. Get Table Information**

```javascript
// Get table schema and column information
const getTableInfo = async (tableName) => {
    try {
        const response = await placeAPI.get(`/${tableName}/info`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get info for table ${tableName}:`, error);
        throw error;
    }
};

// Usage example
const placesInfo = await getTableInfo('places');
console.log('Places table columns:', placesInfo.columns);
console.log('Allowed columns for current role:', placesInfo.allowedColumns);
console.log('Available filters:', placesInfo.filterCapabilities);
```

### **3. Basic Data Retrieval**

```javascript
// Get data from a table with basic parameters
const getTableData = async (tableName, options = {}) => {
    try {
        const params = {
            limit: options.limit || 20,
            page: options.page || 1,
            ...options
        };

        const response = await placeAPI.get(`/${tableName}`, params);
        return response.data;
    } catch (error) {
        console.error(`Failed to get data from ${tableName}:`, error);
        throw error;
    }
};

// Usage examples
const places = await getTableData('places', { limit: 10, page: 1 });
const visitors = await getTableData('visitors', { limit: 50 });
const todayVisits = await getTableData('todays_visits');
```

---

## 🔍 **Advanced Filtering Examples**

### **1. Text Search Filtering**

```javascript
// Search visitors by name
const searchVisitorsByName = async (searchTerm) => {
    try {
        const filters = JSON.stringify([
            {
                column: 'first_name',
                operator: 'contains',
                value: searchTerm
            }
        ]);

        const response = await placeAPI.get('/visitors', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to search visitors:', error);
        throw error;
    }
};

// Search places by location
const searchPlacesByLocation = async (city) => {
    try {
        const filters = JSON.stringify([
            {
                column: 'city',
                operator: 'equals',
                value: city
            }
        ]);

        const response = await placeAPI.get('/places', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to search places by location:', error);
        throw error;
    }
};

// Usage
const visitors = await searchVisitorsByName('John');
const placesInNYC = await searchPlacesByLocation('New York');
```

### **2. Date Range Filtering**

```javascript
// Get visits from date range
const getVisitsByDateRange = async (startDate, endDate) => {
    try {
        const filters = JSON.stringify([
            {
                column: 'scheduled_start_time',
                operator: 'date_between',
                value: [startDate, endDate]
            }
        ]);

        const response = await placeAPI.get('/visits', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to get visits by date range:', error);
        throw error;
    }
};

// Get today's visits
const getTodaysVisits = async () => {
    const today = new Date().toISOString().split('T')[0];
    return getVisitsByDateRange(today, today);
};

// Usage
const thisWeekVisits = await getVisitsByDateRange('2023-12-01', '2023-12-07');
const todaysVisits = await getTodaysVisits();
```

### **3. Numeric Range Filtering**

```javascript
// Get places by capacity range
const getPlacesByCapacity = async (minCapacity, maxCapacity) => {
    try {
        const filters = JSON.stringify([
            {
                column: 'capacity',
                operator: 'between',
                value: [minCapacity, maxCapacity]
            }
        ]);

        const response = await placeAPI.get('/places', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to get places by capacity:', error);
        throw error;
    }
};

// Usage
const largePlaces = await getPlacesByCapacity(100, 1000);
```

### **4. Boolean Filtering**

```javascript
// Get active places only
const getActivePlaces = async () => {
    try {
        const filters = JSON.stringify([
            {
                column: 'is_active',
                operator: 'is_true',
                value: true
            }
        ]);

        const response = await placeAPI.get('/places', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to get active places:', error);
        throw error;
    }
};

// Get blacklisted visitors
const getBlacklistedVisitors = async () => {
    try {
        const filters = JSON.stringify([
            {
                column: 'is_blacklisted',
                operator: 'is_true',
                value: true
            }
        ]);

        const response = await placeAPI.get('/visitors', { filters });
        return response.data;
    } catch (error) {
        console.error('Failed to get blacklisted visitors:', error);
        throw error;
    }
};
```

---

## 🎯 **Real-World Frontend Examples**

### **1. Reception Dashboard Component**

```javascript
// React component for reception dashboard
import React, { useState, useEffect } from 'react';

const ReceptionDashboard = () => {
    const [todaysVisits, setTodaysVisits] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Load today's visits
            const visitsResponse = await placeAPI.get('/todays_visits');
            setTodaysVisits(visitsResponse.data);

            // Load recent visitors
            const visitorsResponse = await placeAPI.get('/visitors', { limit: 20 });
            setVisitors(visitorsResponse.data);

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            alert('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const searchVisitors = async (searchTerm) => {
        if (!searchTerm.trim()) {
            loadDashboardData();
            return;
        }

        try {
            const filters = JSON.stringify([
                {
                    column: 'first_name',
                    operator: 'contains',
                    value: searchTerm
                }
            ]);

            const response = await placeAPI.get('/visitors', { filters });
            setVisitors(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="reception-dashboard">
            <h2>Reception Dashboard</h2>
            
            {/* Search */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search visitors by name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchVisitors(e.target.value);
                    }}
                />
            </div>

            {/* Today's Visits */}
            <div className="todays-visits">
                <h3>Today's Visits ({todaysVisits.length})</h3>
                <div className="visits-list">
                    {todaysVisits.map(visit => (
                        <div key={visit.id} className="visit-card">
                            <h4>{visit.first_name} {visit.last_name}</h4>
                            <p>Company: {visit.company}</p>
                            <p>Purpose: {visit.visit_purpose}</p>
                            <p>Time: {new Date(visit.scheduled_start_time).toLocaleTimeString()}</p>
                            <p>Status: {visit.visit_status}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Visitors */}
            <div className="recent-visitors">
                <h3>Recent Visitors ({visitors.length})</h3>
                <div className="visitors-list">
                    {visitors.map(visitor => (
                        <div key={visitor.id} className="visitor-card">
                            <h4>{visitor.first_name} {visitor.last_name}</h4>
                            <p>Email: {visitor.email}</p>
                            <p>Phone: {visitor.phone}</p>
                            <p>Company: {visitor.company}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReceptionDashboard;
```

### **2. Place Management Component**

```javascript
// React component for place management
import React, { useState, useEffect } from 'react';

const PlaceManagement = () => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: '',
        placeType: '',
        isActive: true
    });

    useEffect(() => {
        loadPlaces();
    }, [filters]);

    const loadPlaces = async () => {
        try {
            setLoading(true);
            
            // Build filters array
            const filterArray = [];
            
            if (filters.city) {
                filterArray.push({
                    column: 'city',
                    operator: 'equals',
                    value: filters.city
                });
            }
            
            if (filters.placeType) {
                filterArray.push({
                    column: 'place_type',
                    operator: 'equals',
                    value: filters.placeType
                });
            }
            
            if (filters.isActive !== null) {
                filterArray.push({
                    column: 'is_active',
                    operator: filters.isActive ? 'is_true' : 'is_false',
                    value: filters.isActive
                });
            }

            const params = {
                limit: 50,
                filters: JSON.stringify(filterArray)
            };

            const response = await placeAPI.get('/places', params);
            setPlaces(response.data);

        } catch (error) {
            console.error('Failed to load places:', error);
            alert('Failed to load places. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPlaceStatistics = async (placeId) => {
        try {
            const filters = JSON.stringify([
                {
                    column: 'place_id',
                    operator: 'equals',
                    value: placeId
                }
            ]);

            const response = await placeAPI.get('/place_statistics', { filters });
            return response.data;
        } catch (error) {
            console.error('Failed to get place statistics:', error);
            return [];
        }
    };

    if (loading) {
        return <div>Loading places...</div>;
    }

    return (
        <div className="place-management">
            <h2>Place Management</h2>
            
            {/* Filters */}
            <div className="filters">
                <select
                    value={filters.city}
                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                >
                    <option value="">All Cities</option>
                    <option value="New York">New York</option>
                    <option value="Los Angeles">Los Angeles</option>
                    <option value="Chicago">Chicago</option>
                </select>

                <select
                    value={filters.placeType}
                    onChange={(e) => setFilters({...filters, placeType: e.target.value})}
                >
                    <option value="">All Types</option>
                    <option value="office">Office</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                    <option value="retail">Retail</option>
                </select>

                <select
                    value={filters.isActive}
                    onChange={(e) => setFilters({...filters, isActive: e.target.value === 'true'})}
                >
                    <option value={true}>Active Only</option>
                    <option value={false}>Inactive Only</option>
                    <option value="">All Status</option>
                </select>
            </div>

            {/* Places List */}
            <div className="places-list">
                {places.map(place => (
                    <div key={place.id} className="place-card">
                        <h3>{place.name}</h3>
                        <p>Type: {place.place_type}</p>
                        <p>Address: {place.address}</p>
                        <p>City: {place.city}</p>
                        <p>Capacity: {place.capacity}</p>
                        <p>Status: {place.is_active ? 'Active' : 'Inactive'}</p>
                        <p>Phone: {place.phone}</p>
                        <p>Email: {place.email}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaceManagement;
```

---

## 🔒 **Error Handling & Security**

### **1. Token Expiration Handling**

```javascript
// Automatic token refresh and retry
class SecureAPIClient extends PlaceManagementAPI {
    async makeRequest(endpoint, options = {}) {
        try {
            return await super.makeRequest(endpoint, options);
        } catch (error) {
            if (error.message.includes('Authentication failed')) {
                // Token expired, redirect to login
                this.tokenManager.clearToken();
                window.location.href = '/login';
                return;
            }
            throw error;
        }
    }
}

const secureAPI = new SecureAPIClient();
```

### **2. Role-Based UI Rendering**

```javascript
// Role-based component rendering
const RoleBasedComponent = ({ children, allowedRoles }) => {
    const userRole = tokenManager.getUserRole();
    
    if (!allowedRoles.includes(userRole)) {
        return <div>Access Denied</div>;
    }
    
    return children;
};

// Usage in components
<RoleBasedComponent allowedRoles={['admin', 'manager']}>
    <PlaceManagement />
</RoleBasedComponent>

<RoleBasedComponent allowedRoles={['reception', 'employee']}>
    <ReceptionDashboard />
</RoleBasedComponent>
```

### **3. Error Boundary Component**

```javascript
// Error boundary for API failures
class APIErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('API Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>Please refresh the page or contact support.</p>
                    <button onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrap your app with error boundary
<APIErrorBoundary>
    <App />
</APIErrorBoundary>
```

---

## 📱 **Complete Frontend Integration Example**

### **App.js - Main Application**

```javascript
import React, { useState, useEffect } from 'react';
import { TokenManager } from './utils/TokenManager';
import { PlaceManagementAPI } from './api/PlaceManagementAPI';
import Login from './components/Login';
import ReceptionDashboard from './components/ReceptionDashboard';
import PlaceManagement from './components/PlaceManagement';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = () => {
        const tokenManager = new TokenManager();
        const authenticated = tokenManager.isAuthenticated();
        
        setIsAuthenticated(authenticated);
        setUserRole(tokenManager.getUserRole());
        setLoading(false);
    };

    const handleLogin = (token, user) => {
        const tokenManager = new TokenManager();
        tokenManager.setToken(token, user.role, user.id);
        
        setIsAuthenticated(true);
        setUserRole(user.role);
    };

    const handleLogout = () => {
        const tokenManager = new TokenManager();
        tokenManager.clearToken();
        
        setIsAuthenticated(false);
        setUserRole(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>Place Management System</h1>
                <div className="user-info">
                    <span>Role: {userRole}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="app-main">
                {userRole === 'reception' && <ReceptionDashboard />}
                {userRole === 'employee' && <ReceptionDashboard />}
                {userRole === 'manager' && <PlaceManagement />}
                {userRole === 'admin' && (
                    <div>
                        <PlaceManagement />
                        <ReceptionDashboard />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
```

---

## 🚀 **Quick Start Checklist**

### **1. Setup Authentication**
- [ ] Login to get JWT token
- [ ] Store token securely (localStorage/sessionStorage)
- [ ] Implement token refresh logic
- [ ] Handle token expiration

### **2. Initialize API Client**
- [ ] Create PlaceManagementAPI instance
- [ ] Configure base URL
- [ ] Set up error handling

### **3. Test API Access**
- [ ] Get allowed tables for user role
- [ ] Test basic data retrieval
- [ ] Verify column access permissions
- [ ] Test filtering capabilities

### **4. Build Frontend Components**
- [ ] Create role-based components
- [ ] Implement search and filtering
- [ ] Add error handling and loading states
- [ ] Test with different user roles

### **5. Security Implementation**
- [ ] Validate JWT tokens
- [ ] Implement role-based access control
- [ ] Add error boundaries
- [ ] Handle authentication failures

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

1. **401 Unauthorized**: Token expired or invalid
   - Solution: Re-login and get new token

2. **403 Forbidden**: Insufficient permissions
   - Solution: Check user role and table permissions

3. **CORS Issues**: Cross-origin requests blocked
   - Solution: Configure CORS in backend or use proxy

4. **Rate Limiting**: Too many requests
   - Solution: Implement request throttling

### **API Endpoints Summary:**

| **Endpoint** | **Method** | **Purpose** |
|--------------|------------|-------------|
| `/tables` | GET | Get allowed tables |
| `/:table/info` | GET | Get table schema |
| `/:table` | GET | Get table data |
| `/:table/search` | POST | Advanced search |
| `/search` | POST | Global search |
| `/capabilities` | GET | Get filter capabilities |

**Your Place Management System is now ready for frontend integration!** 🎉
