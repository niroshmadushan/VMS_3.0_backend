# 🔐 POST-LOGIN AUTHENTICATION FLOW DOCUMENTATION

## 📋 **Complete Login Flow & Token Management**

### 🎯 **What Happens After Successful Login**

When a user successfully completes the login process (email + password + OTP verification), the backend returns:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-09-30T15:57:04.302Z"
    }
  }
}
```

---

## 🔑 **Authentication Tokens Explained**

### **1. Session Token (JWT)**
- **Purpose**: Primary authentication token for API requests
- **Expires**: 24 hours
- **Contains**: User ID, session type
- **Usage**: Include in `Authorization: Bearer <token>` header

### **2. Refresh Token**
- **Purpose**: Generate new session tokens when current one expires
- **Expires**: 7 days (configurable)
- **Usage**: Call `/api/auth/refresh-token` endpoint

### **3. Session ID**
- **Purpose**: Database session tracking
- **Stored**: In `user_sessions` table
- **Usage**: Session management and logout

---

## 🛡️ **How to Validate Tokens in Frontend**

### **Step 1: Store Tokens After Login**
```javascript
// After successful login
const loginResponse = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'your_app_id',
    'X-Service-Key': 'your_service_key'
  },
  body: JSON.stringify({ email, otpCode })
});

const data = await loginResponse.json();

if (data.success) {
  // Store tokens securely
  localStorage.setItem('authToken', data.data.session.token);
  localStorage.setItem('refreshToken', data.data.session.refreshToken);
  localStorage.setItem('userData', JSON.stringify(data.data.user));
}
```

### **Step 2: Make Authenticated API Calls**
```javascript
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};

// Example usage
const getUserSessions = async () => {
  const response = await makeAuthenticatedRequest('/api/auth/sessions');
  return await response.json();
};
```

### **Step 3: Handle Token Expiration**
```javascript
const handleTokenRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.data.token);
    return true;
  } else {
    // Redirect to login
    localStorage.clear();
    window.location.href = '/login';
    return false;
  }
};
```

---

## 🔍 **Token Validation APIs**

### **1. Validate Current Token**
```http
POST /api/auth/validate-token
Content-Type: application/json

{
  "token": "your-jwt-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

### **2. Refresh Expired Token**
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new-jwt-token-here"
  }
}
```

---

## 🛡️ **Protected API Endpoints**

### **Authentication Required Endpoints:**
All these endpoints require the `Authorization: Bearer <token>` header:

#### **Session Management:**
- `GET /api/auth/sessions` - Get user sessions
- `DELETE /api/auth/sessions/:sessionId` - Terminate specific session
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all devices

#### **Password Management:**
- `POST /api/auth/change-password` - Change password

#### **Admin Endpoints (Admin Role Required):**
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user by ID
- `PUT /api/admin/users/:userId/role` - Update user role
- `PUT /api/admin/users/:userId/lock` - Toggle user lock
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/analytics/logins` - Get login analytics

---

## 🔐 **Security Features**

### **1. Token Security:**
- **JWT Signature**: Tokens are signed with secret key
- **Expiration**: Automatic token expiration (24 hours)
- **Session Tracking**: Database-backed session validation
- **Device Tracking**: Each session tracks device info and IP

### **2. Session Management:**
- **Multi-Device Support**: Users can be logged in on multiple devices
- **Session Termination**: Can logout from specific devices or all devices
- **Automatic Cleanup**: Expired sessions are automatically invalidated

### **3. Request Validation:**
- **Token Verification**: Every protected request validates the token
- **Session Check**: Verifies session exists and is active in database
- **User Context**: Attaches user information to request object

---

## 📱 **Frontend Integration Examples**

### **Complete Authentication Wrapper:**
```javascript
class AuthManager {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.appId = 'your_app_id';
    this.serviceKey = 'your_service_key';
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Make authenticated request with auto-retry
  async authenticatedRequest(endpoint, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the original request
        return this.authenticatedRequest(endpoint, options);
      } else {
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Refresh expired token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('authToken', data.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens and redirect to login
    this.logout();
    return false;
  }

  // Logout user
  async logout() {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    localStorage.clear();
    window.location.href = '/login';
  }

  // Get user sessions
  async getUserSessions() {
    const response = await this.authenticatedRequest('/auth/sessions');
    return await response.json();
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await this.authenticatedRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    return await response.json();
  }
}

// Usage
const auth = new AuthManager();

// Check authentication status
if (auth.isAuthenticated()) {
  console.log('User is logged in');
} else {
  console.log('User needs to login');
}

// Make authenticated requests
auth.getUserSessions().then(sessions => {
  console.log('User sessions:', sessions);
});
```

---

## 🚨 **Error Handling**

### **Common Authentication Errors:**

#### **401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```
**Solution**: Include `Authorization: Bearer <token>` header

#### **401 Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```
**Solution**: Token is corrupted or expired, try refreshing

#### **401 Invalid Session:**
```json
{
  "success": false,
  "message": "Invalid or expired session"
}
```
**Solution**: Session expired or invalidated, user needs to login again

#### **403 Insufficient Permissions:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
**Solution**: User doesn't have required role (e.g., admin endpoints)

---

## 🔧 **Testing Token Validation**

### **Test Token Validity:**
```bash
curl -X POST http://localhost:3000/api/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your-jwt-token-here"}'
```

### **Test Authenticated Endpoint:**
```bash
curl -X GET http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer your-jwt-token-here"
```

### **Test Admin Endpoint:**
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer your-admin-jwt-token-here"
```

---

## 📊 **Session Data Structure**

### **Database Session Record:**
```sql
{
  "id": 1,
  "user_id": 1,
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device_info": {
    "browser": "Mozilla/5.0...",
    "timestamp": "2025-09-29T15:57:04.302Z"
  },
  "ip_address": "127.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "is_active": 1,
  "expires_at": "2025-09-30T15:57:04.302Z",
  "created_at": "2025-09-29T15:57:04.302Z"
}
```

### **JWT Token Payload:**
```json
{
  "userId": 1,
  "type": "session",
  "iat": 1696007824,
  "exp": 1696094224
}
```

---

## 🎯 **Best Practices**

### **1. Token Storage:**
- ✅ Store tokens in `localStorage` or `sessionStorage`
- ✅ Consider `httpOnly` cookies for production
- ❌ Never store tokens in plain text
- ❌ Never expose tokens in URLs

### **2. Token Usage:**
- ✅ Always include tokens in `Authorization` header
- ✅ Handle token expiration gracefully
- ✅ Implement automatic token refresh
- ❌ Never send tokens in request body

### **3. Security:**
- ✅ Use HTTPS in production
- ✅ Implement proper CORS policies
- ✅ Validate tokens on every protected request
- ✅ Log authentication events

### **4. User Experience:**
- ✅ Show loading states during authentication
- ✅ Handle network errors gracefully
- ✅ Provide clear error messages
- ✅ Implement automatic logout on token expiration

---

## 📝 **Summary**

After successful login, your application receives:

1. **JWT Session Token** - Use for all authenticated API calls
2. **Refresh Token** - Use to get new session tokens
3. **User Data** - Basic user information
4. **Session Tracking** - Database-backed session management

**Key Points:**
- Include `Authorization: Bearer <token>` in all protected requests
- Handle token expiration with refresh mechanism
- Validate tokens on both frontend and backend
- Implement proper error handling for authentication failures
- Use session management for multi-device support

**Your authentication system is production-ready with enterprise-level security features!** 🚀
