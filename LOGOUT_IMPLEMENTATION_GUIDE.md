# 🚪 LOGOUT FUNCTIONALITY IMPLEMENTATION GUIDE

## 📋 **Complete Logout System Documentation**

This guide provides comprehensive documentation for implementing all logout functionality in your authentication backend.

---

## 🎯 **Available Logout Endpoints**

### **1. Single Session Logout**
**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required (Bearer Token)  
**Purpose:** Logs out the current session only

### **2. Logout from All Devices**
**Endpoint:** `POST /api/auth/logout-all`  
**Authentication:** Required (Bearer Token)  
**Purpose:** Logs out user from all devices simultaneously

### **3. Get User Sessions**
**Endpoint:** `GET /api/auth/sessions`  
**Authentication:** Required (Bearer Token)  
**Purpose:** View all active sessions for the user

### **4. Terminate Specific Session**
**Endpoint:** `DELETE /api/auth/sessions/:sessionId`  
**Authentication:** Required (Bearer Token)  
**Purpose:** Terminate a specific session by ID

---

## 🔧 **Frontend Implementation**

### **Complete Logout Manager Class**

```javascript
class LogoutManager {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }

    // Get stored authentication token
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    // Make authenticated request
    async makeAuthenticatedRequest(endpoint, options = {}) {
        const token = this.getAuthToken();
        
        if (!token) {
            throw new Error('No authentication token found. Please login first.');
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
        }

        return response;
    }

    // 1. SINGLE SESSION LOGOUT
    async logoutCurrentSession() {
        try {
            console.log('🚪 Logging out current session...');
            
            const response = await this.makeAuthenticatedRequest('/auth/logout', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Logout successful');
                
                // Clear local storage
                this.clearLocalStorage();
                
                // Redirect to login page
                this.redirectToLogin();
                
                return {
                    success: true,
                    message: 'Logged out successfully'
                };
            } else {
                throw new Error(data.message || 'Logout failed');
            }

        } catch (error) {
            console.error('❌ Logout error:', error.message);
            
            // Even if logout request fails, clear local storage
            this.clearLocalStorage();
            this.redirectToLogin();
            
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 2. LOGOUT FROM ALL DEVICES
    async logoutAllDevices() {
        try {
            console.log('🚪 Logging out from all devices...');
            
            const response = await this.makeAuthenticatedRequest('/auth/logout-all', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Logout from all devices successful');
                
                // Clear local storage
                this.clearLocalStorage();
                
                // Show success message
                alert('You have been logged out from all devices successfully.');
                
                // Redirect to login page
                this.redirectToLogin();
                
                return {
                    success: true,
                    message: 'Logged out from all devices successfully'
                };
            } else {
                throw new Error(data.message || 'Logout from all devices failed');
            }

        } catch (error) {
            console.error('❌ Logout all devices error:', error.message);
            
            // Clear local storage even if request fails
            this.clearLocalStorage();
            this.redirectToLogin();
            
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 3. GET USER SESSIONS
    async getUserSessions() {
        try {
            console.log('📱 Fetching user sessions...');
            
            const response = await this.makeAuthenticatedRequest('/auth/sessions');

            const data = await response.json();

            if (data.success) {
                console.log('✅ Sessions fetched successfully');
                return {
                    success: true,
                    sessions: data.data.sessions,
                    totalSessions: data.data.totalSessions
                };
            } else {
                throw new Error(data.message || 'Failed to fetch sessions');
            }

        } catch (error) {
            console.error('❌ Get sessions error:', error.message);
            return {
                success: false,
                message: error.message,
                sessions: []
            };
        }
    }

    // 4. TERMINATE SPECIFIC SESSION
    async terminateSession(sessionId) {
        try {
            console.log(`🗑️ Terminating session: ${sessionId}`);
            
            const response = await this.makeAuthenticatedRequest(`/auth/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Session terminated successfully');
                return {
                    success: true,
                    message: 'Session terminated successfully'
                };
            } else {
                throw new Error(data.message || 'Failed to terminate session');
            }

        } catch (error) {
            console.error('❌ Terminate session error:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // HELPER METHODS
    clearLocalStorage() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        console.log('🧹 Local storage cleared');
    }

    redirectToLogin() {
        console.log('🔄 Redirecting to login page...');
        window.location.href = '/login';
    }

    // UTILITY: Check if user is logged in
    isLoggedIn() {
        const token = this.getAuthToken();
        return !!token;
    }

    // UTILITY: Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }
}
```

---

## 🖥️ **HTML Implementation Examples**

### **1. Basic Logout Button**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard</title>
    <style>
        .logout-container {
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        
        .user-info {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .logout-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .btn-logout {
            background-color: #dc3545;
            color: white;
        }
        
        .btn-logout:hover {
            background-color: #c82333;
        }
        
        .btn-logout-all {
            background-color: #fd7e14;
            color: white;
        }
        
        .btn-logout-all:hover {
            background-color: #e8681a;
        }
        
        .btn-sessions {
            background-color: #007bff;
            color: white;
        }
        
        .btn-sessions:hover {
            background-color: #0056b3;
        }
        
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        .sessions-container {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            display: none;
        }
        
        .session-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        
        .session-item.current {
            border-left-color: #28a745;
        }
        
        .session-meta {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .terminate-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 10px;
        }
        
        .terminate-btn:hover {
            background-color: #c82333;
        }
    </style>
</head>
<body>
    <div class="logout-container">
        <div class="user-info">
            <h2>Welcome to Dashboard</h2>
            <div id="userInfo">
                <p><strong>Loading user information...</strong></p>
            </div>
        </div>

        <div class="logout-buttons">
            <button class="btn btn-logout" onclick="handleLogout()">
                🚪 Logout Current Session
            </button>
            
            <button class="btn btn-logout-all" onclick="handleLogoutAll()">
                🚪🚪 Logout All Devices
            </button>
            
            <button class="btn btn-sessions" onclick="handleViewSessions()">
                📱 View Active Sessions
            </button>
        </div>

        <div id="sessionsContainer" class="sessions-container">
            <h3>Active Sessions</h3>
            <div id="sessionsList"></div>
        </div>
    </div>

    <script>
        // Initialize logout manager
        const logoutManager = new LogoutManager();

        // Load user information on page load
        window.onload = function() {
            loadUserInfo();
        };

        // Load current user information
        function loadUserInfo() {
            const user = logoutManager.getCurrentUser();
            const userInfoDiv = document.getElementById('userInfo');
            
            if (user) {
                userInfoDiv.innerHTML = `
                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                `;
            } else {
                userInfoDiv.innerHTML = '<p>No user data found. Please login again.</p>';
            }
        }

        // Handle single session logout
        async function handleLogout() {
            const button = event.target;
            button.classList.add('loading');
            button.textContent = 'Logging out...';

            try {
                const result = await logoutManager.logoutCurrentSession();
                
                if (result.success) {
                    console.log('Logout successful');
                } else {
                    alert('Logout failed: ' + result.message);
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('Logout failed: ' + error.message);
            } finally {
                button.classList.remove('loading');
                button.textContent = '🚪 Logout Current Session';
            }
        }

        // Handle logout from all devices
        async function handleLogoutAll() {
            const button = event.target;
            button.classList.add('loading');
            button.textContent = 'Logging out all devices...';

            try {
                // Confirm action
                const confirmed = confirm(
                    'Are you sure you want to logout from ALL devices? ' +
                    'This will end all your active sessions.'
                );

                if (!confirmed) {
                    button.classList.remove('loading');
                    button.textContent = '🚪🚪 Logout All Devices';
                    return;
                }

                const result = await logoutManager.logoutAllDevices();
                
                if (result.success) {
                    console.log('Logout all devices successful');
                } else {
                    alert('Logout from all devices failed: ' + result.message);
                }
            } catch (error) {
                console.error('Logout all devices error:', error);
                alert('Logout from all devices failed: ' + error.message);
            } finally {
                button.classList.remove('loading');
                button.textContent = '🚪🚪 Logout All Devices';
            }
        }

        // Handle view sessions
        async function handleViewSessions() {
            const button = event.target;
            const sessionsContainer = document.getElementById('sessionsContainer');
            const sessionsList = document.getElementById('sessionsList');

            button.classList.add('loading');
            button.textContent = 'Loading sessions...';

            try {
                const result = await logoutManager.getUserSessions();
                
                if (result.success) {
                    displaySessions(result.sessions);
                    sessionsContainer.style.display = 'block';
                } else {
                    alert('Failed to load sessions: ' + result.message);
                }
            } catch (error) {
                console.error('Get sessions error:', error);
                alert('Failed to load sessions: ' + error.message);
            } finally {
                button.classList.remove('loading');
                button.textContent = '📱 View Active Sessions';
            }
        }

        // Display sessions
        function displaySessions(sessions) {
            const sessionsList = document.getElementById('sessionsList');
            const currentToken = logoutManager.getAuthToken();
            
            if (sessions.length === 0) {
                sessionsList.innerHTML = '<p>No active sessions found.</p>';
                return;
            }

            const sessionsHTML = sessions.map(session => {
                const isCurrentSession = session.deviceInfo && 
                    session.deviceInfo.timestamp === new Date().toISOString().split('T')[0];
                
                return `
                    <div class="session-item ${isCurrentSession ? 'current' : ''}">
                        <h4>${getDeviceName(session.deviceInfo)}</h4>
                        <p><strong>IP Address:</strong> ${session.ipAddress}</p>
                        <p><strong>Created:</strong> ${formatDate(session.createdAt)}</p>
                        <p><strong>Expires:</strong> ${formatDate(session.expiresAt)}</p>
                        <div class="session-meta">
                            <strong>User Agent:</strong> ${session.userAgent}
                        </div>
                        ${!isCurrentSession ? `
                            <button class="terminate-btn" onclick="terminateSession(${session.id})">
                                Terminate Session
                            </button>
                        ` : '<p><em>Current Session</em></p>'}
                    </div>
                `;
            }).join('');

            sessionsList.innerHTML = sessionsHTML;
        }

        // Terminate specific session
        async function terminateSession(sessionId) {
            try {
                const confirmed = confirm('Are you sure you want to terminate this session?');
                
                if (!confirmed) return;

                const result = await logoutManager.terminateSession(sessionId);
                
                if (result.success) {
                    alert('Session terminated successfully');
                    // Refresh sessions list
                    handleViewSessions();
                } else {
                    alert('Failed to terminate session: ' + result.message);
                }
            } catch (error) {
                console.error('Terminate session error:', error);
                alert('Failed to terminate session: ' + error.message);
            }
        }

        // Helper functions
        function getDeviceName(deviceInfo) {
            if (!deviceInfo || !deviceInfo.browser) return 'Unknown Device';
            
            const browser = deviceInfo.browser;
            if (browser.includes('Chrome')) return 'Chrome Browser';
            if (browser.includes('Firefox')) return 'Firefox Browser';
            if (browser.includes('Safari')) return 'Safari Browser';
            if (browser.includes('Edge')) return 'Edge Browser';
            
            return 'Web Browser';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString();
        }
    </script>
</body>
</html>
```

---

## 📱 **React Implementation**

### **Logout Hook**

```javascript
import { useState, useCallback } from 'react';

export const useLogout = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const logoutManager = new LogoutManager();

    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await logoutManager.logoutCurrentSession();
            
            if (!result.success) {
                setError(result.message);
            }
            
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logoutAll = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await logoutManager.logoutAllDevices();
            
            if (!result.success) {
                setError(result.message);
            }
            
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const getSessions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await logoutManager.getUserSessions();
            
            if (!result.success) {
                setError(result.message);
            }
            
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message, sessions: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        logout,
        logoutAll,
        getSessions,
        loading,
        error
    };
};
```

### **Logout Component**

```jsx
import React, { useState } from 'react';
import { useLogout } from './useLogout';

const LogoutComponent = () => {
    const { logout, logoutAll, getSessions, loading, error } = useLogout();
    const [sessions, setSessions] = useState([]);
    const [showSessions, setShowSessions] = useState(false);

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            console.log('Logged out successfully');
        }
    };

    const handleLogoutAll = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to logout from ALL devices?'
        );
        
        if (confirmed) {
            const result = await logoutAll();
            if (result.success) {
                alert('Logged out from all devices successfully');
            }
        }
    };

    const handleViewSessions = async () => {
        const result = await getSessions();
        if (result.success) {
            setSessions(result.sessions);
            setShowSessions(true);
        }
    };

    return (
        <div className="logout-container">
            {error && <div className="error-message">{error}</div>}
            
            <div className="logout-buttons">
                <button 
                    onClick={handleLogout}
                    disabled={loading}
                    className="btn btn-logout"
                >
                    {loading ? 'Logging out...' : '🚪 Logout'}
                </button>
                
                <button 
                    onClick={handleLogoutAll}
                    disabled={loading}
                    className="btn btn-logout-all"
                >
                    {loading ? 'Logging out...' : '🚪🚪 Logout All Devices'}
                </button>
                
                <button 
                    onClick={handleViewSessions}
                    disabled={loading}
                    className="btn btn-sessions"
                >
                    {loading ? 'Loading...' : '📱 View Sessions'}
                </button>
            </div>

            {showSessions && (
                <div className="sessions-container">
                    <h3>Active Sessions</h3>
                    {sessions.map(session => (
                        <div key={session.id} className="session-item">
                            <h4>Session {session.id}</h4>
                            <p>IP: {session.ipAddress}</p>
                            <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogoutComponent;
```

---

## 🧪 **Testing Implementation**

### **Test Script**

```javascript
// test-logout.js
const LogoutManager = require('./LogoutManager');

async function testLogoutFunctionality() {
    const logoutManager = new LogoutManager();
    
    console.log('🧪 Testing Logout Functionality...\n');

    // Test 1: Check if logged in
    console.log('1. Checking login status...');
    const isLoggedIn = logoutManager.isLoggedIn();
    console.log(`   Status: ${isLoggedIn ? 'Logged in' : 'Not logged in'}\n`);

    if (!isLoggedIn) {
        console.log('❌ Please login first to test logout functionality');
        return;
    }

    // Test 2: Get user sessions
    console.log('2. Getting user sessions...');
    try {
        const sessionsResult = await logoutManager.getUserSessions();
        if (sessionsResult.success) {
            console.log(`   ✅ Found ${sessionsResult.totalSessions} active sessions`);
            sessionsResult.sessions.forEach((session, index) => {
                console.log(`   Session ${index + 1}: ID ${session.id}, IP ${session.ipAddress}`);
            });
        } else {
            console.log(`   ❌ Failed: ${sessionsResult.message}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 3: Logout (uncomment to test)
    /*
    console.log('\n3. Testing logout...');
    try {
        const logoutResult = await logoutManager.logoutCurrentSession();
        if (logoutResult.success) {
            console.log('   ✅ Logout successful');
        } else {
            console.log(`   ❌ Failed: ${logoutResult.message}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    */

    console.log('\n✅ Logout functionality test completed');
}

// Run tests
testLogoutFunctionality();
```

### **CURL Testing Commands**

```bash
#!/bin/bash
# test-logout.sh

BASE_URL="http://localhost:3000/api"
TOKEN="your-jwt-token-here"

echo "🧪 Testing Logout Endpoints...\n"

# Test 1: Get sessions
echo "1. Getting user sessions..."
curl -X GET "$BASE_URL/auth/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo "\n"

# Test 2: Single logout
echo "2. Testing single logout..."
curl -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo "\n"

# Test 3: Logout all devices (uncomment to test)
# echo "3. Testing logout all devices..."
# curl -X POST "$BASE_URL/auth/logout-all" \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   | jq '.'

echo "\n✅ Logout testing completed"
```

---

## 🔒 **Security Considerations**

### **1. Token Security**
- Always use HTTPS in production
- Store tokens securely (localStorage/sessionStorage)
- Never expose tokens in URLs or logs
- Implement token expiration handling

### **2. Session Management**
- Validate sessions on every request
- Implement proper session cleanup
- Track device information for security
- Log all logout activities

### **3. User Experience**
- Provide clear feedback for all actions
- Implement loading states
- Handle network errors gracefully
- Confirm destructive actions (logout all devices)

---

## 📊 **API Response Examples**

### **Successful Logout Response**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Successful Logout All Response**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

### **Sessions Response**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "deviceInfo": {
          "browser": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "timestamp": "2025-09-29T15:57:04.302Z"
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "isActive": true,
        "createdAt": "2025-09-29T15:57:04.302Z",
        "expiresAt": "2025-09-30T15:57:04.302Z"
      }
    ],
    "totalSessions": 1
  }
}
```

### **Error Responses**
```json
{
  "success": false,
  "message": "Access token required"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired session"
}
```

---

## 🎯 **Summary**

This implementation provides:

✅ **Complete logout functionality** - Single session and all devices  
✅ **Session management** - View and terminate specific sessions  
✅ **Frontend integration** - Ready-to-use JavaScript classes and components  
✅ **Error handling** - Comprehensive error management  
✅ **Security features** - Proper token validation and session tracking  
✅ **User experience** - Loading states, confirmations, and feedback  
✅ **Testing tools** - CURL commands and test scripts  

**Your logout system is now fully documented and ready for implementation!** 🚀
