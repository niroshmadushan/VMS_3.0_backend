# 📖 GET My Profile API - Complete Frontend Implementation Guide

## 🎯 Overview

This API allows any authenticated user to retrieve their own profile information.

**Endpoint:** `GET /api/my-profile`

**Base URL:** `http://localhost:3000`

**Full URL:** `http://localhost:3000/api/my-profile`

---

## 🔐 Authentication Requirements

### Required Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Important:** 
- ✅ JWT Token is **REQUIRED**
- ❌ App ID and Service Key are **NOT REQUIRED** for this API
- ✅ Any authenticated user (admin, user, moderator) can use this API

---

## 📝 Step-by-Step: How to Get JWT Token

### Step 1: Login (Requires App Credentials)

```javascript
POST http://localhost:3000/api/auth/login

Headers:
{
  "Content-Type": "application/json",
  "X-App-Id": "default_app_id",
  "X-Service-Key": "default_service_key"
}

Body:
{
  "email": "user@example.com",
  "password": "UserPassword123"
}

Response:
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

### Step 2: Verify OTP (Requires App Credentials)

```javascript
POST http://localhost:3000/api/auth/verify-otp

Headers:
{
  "Content-Type": "application/json",
  "X-App-Id": "default_app_id",
  "X-Service-Key": "default_service_key"
}

Body:
{
  "email": "user@example.com",
  "otpCode": "123456"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 11,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-10-10T06:12:57.248Z"
    }
  }
}
```

**Save the token:**
```javascript
const jwtToken = response.data.data.session.token;
localStorage.setItem('jwt_token', jwtToken);
```

---

## 🚀 GET My Profile API

### Request

**Method:** `GET`

**URL:** `http://localhost:3000/api/my-profile`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**No Body Required** - This is a GET request

---

### Response

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 11,
    "email": "user@example.com",
    "role": "admin",
    "is_email_verified": 1,
    "last_login": "2025-10-09T05:12:57.000Z",
    "user_created_at": "2025-10-08T11:46:43.000Z",
    "user_updated_at": "2025-10-09T05:12:57.000Z",
    "profile_id": 1,
    "first_name": "Nirosh",
    "last_name": "Madushan",
    "phone": "+94771234567",
    "date_of_birth": null,
    "address": "Test Address 123",
    "city": "Colombo",
    "state": "Western",
    "country": "Sri Lanka",
    "postal_code": "10100",
    "avatar_url": null,
    "bio": null,
    "website": null,
    "social_links": null,
    "preferences": null,
    "custom_fields": null,
    "profile_created_at": "2025-10-08T11:46:43.000Z",
    "profile_updated_at": "2025-10-09T05:43:41.000Z"
  }
}
```

**Error Response (401 - Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Error Response (404 - Not Found):**

```json
{
  "success": false,
  "message": "Profile not found"
}
```

---

## 📊 Response Data Structure

### User Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | Integer | User's unique ID | `11` |
| `email` | String | User's email address | `"user@example.com"` |
| `role` | String | User's role | `"admin"`, `"user"`, `"moderator"` |
| `is_email_verified` | Integer | Email verification status (0 or 1) | `1` |
| `last_login` | DateTime | Last login timestamp | `"2025-10-09T05:12:57.000Z"` |
| `user_created_at` | DateTime | Account creation date | `"2025-10-08T11:46:43.000Z"` |
| `user_updated_at` | DateTime | Last account update | `"2025-10-09T05:12:57.000Z"` |

### Profile Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `profile_id` | Integer | Profile unique ID | `1` |
| `first_name` | String | First name | `"Nirosh"` |
| `last_name` | String | Last name | `"Madushan"` |
| `phone` | String | Phone number | `"+94771234567"` |
| `date_of_birth` | Date | Date of birth | `"1990-01-01"` or `null` |
| `address` | String | Street address | `"Test Address 123"` |
| `city` | String | City | `"Colombo"` |
| `state` | String | State/Province | `"Western"` |
| `country` | String | Country | `"Sri Lanka"` |
| `postal_code` | String | Postal/ZIP code | `"10100"` |
| `avatar_url` | String | Avatar image URL | `"https://example.com/avatar.jpg"` or `null` |
| `bio` | Text | Biography/About me | `"Software developer"` or `null` |
| `website` | String | Personal website | `"https://example.com"` or `null` |
| `social_links` | JSON | Social media links | `{}` or `null` |
| `preferences` | JSON | User preferences | `{}` or `null` |
| `custom_fields` | JSON | Custom profile fields | `{}` or `null` |
| `profile_created_at` | DateTime | Profile creation date | `"2025-10-08T11:46:43.000Z"` |
| `profile_updated_at` | DateTime | Last profile update | `"2025-10-09T05:43:41.000Z"` |

---

## 💻 Frontend Implementation Examples

### 1. Vanilla JavaScript (Fetch API)

```javascript
// Get JWT token from storage
const jwtToken = localStorage.getItem('jwt_token');

// Make API request
async function getMyProfile() {
  try {
    const response = await fetch('http://localhost:3000/api/my-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const result = await response.json();

    if (result.success) {
      const profile = result.data;
      
      // Use the profile data
      console.log('User ID:', profile.id);
      console.log('Name:', profile.first_name, profile.last_name);
      console.log('Email:', profile.email);
      console.log('Phone:', profile.phone);
      console.log('City:', profile.city);
      
      // Display in UI
      document.getElementById('userName').textContent = 
        `${profile.first_name} ${profile.last_name}`;
      document.getElementById('userEmail').textContent = profile.email;
      document.getElementById('userRole').textContent = profile.role;
      
    } else {
      console.error('Error:', result.message);
      
      // Handle unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Call the function
getMyProfile();
```

---

### 2. Axios (With Error Handling)

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';
const jwtToken = localStorage.getItem('jwt_token');

async function getMyProfile() {
  try {
    const response = await axios.get(`${API_BASE}/api/my-profile`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    if (response.data.success) {
      const profile = response.data.data;
      
      // Use profile data
      return profile;
      
    } else {
      throw new Error(response.data.message);
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      // Token invalid or expired
      console.error('Unauthorized - please login again');
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    } else {
      console.error('Error fetching profile:', error.message);
    }
    throw error;
  }
}

// Usage
getMyProfile()
  .then(profile => {
    console.log('Profile loaded:', profile);
  })
  .catch(error => {
    console.error('Failed to load profile');
  });
```

---

### 3. React Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('jwt_token');
      
      const response = await axios.get('http://localhost:3000/api/my-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setProfile(response.data.data);
      }
      
    } catch (err) {
      if (err.response?.status === 401) {
        // Redirect to login
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile data</div>;

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      
      <div className="profile-info">
        <div className="info-row">
          <label>Name:</label>
          <span>{profile.first_name} {profile.last_name}</span>
        </div>
        
        <div className="info-row">
          <label>Email:</label>
          <span>{profile.email}</span>
        </div>
        
        <div className="info-row">
          <label>Role:</label>
          <span>{profile.role}</span>
        </div>
        
        <div className="info-row">
          <label>Phone:</label>
          <span>{profile.phone || 'Not set'}</span>
        </div>
        
        <div className="info-row">
          <label>Location:</label>
          <span>
            {profile.city && profile.country 
              ? `${profile.city}, ${profile.country}` 
              : 'Not set'}
          </span>
        </div>
        
        <div className="info-row">
          <label>Email Verified:</label>
          <span>{profile.is_email_verified ? '✅ Yes' : '❌ No'}</span>
        </div>
      </div>
      
      <button onClick={fetchProfile}>Refresh</button>
    </div>
  );
}

export default MyProfile;
```

---

### 4. API Service Class (Reusable)

```javascript
// services/ProfileService.js

class ProfileService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('jwt_token');
  }

  // Set token (after login)
  setToken(token) {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  // Get headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get my profile
  async getMyProfile() {
    try {
      const response = await fetch(`${this.baseURL}/my-profile`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
      
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Handle unauthorized
  handleUnauthorized() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
}

// Export singleton instance
export default new ProfileService();
```

**Usage:**
```javascript
import ProfileService from './services/ProfileService';

// Get profile
async function displayProfile() {
  try {
    const profile = await ProfileService.getMyProfile();
    console.log('Profile:', profile);
    
    // Display in UI
    document.getElementById('userName').textContent = 
      `${profile.first_name} ${profile.last_name}`;
      
  } catch (error) {
    console.error('Failed to load profile');
  }
}

displayProfile();
```

---

## 🔄 Complete Authentication Flow

### Full Flow with Token Management

```javascript
class AuthManager {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.appId = 'default_app_id';
    this.serviceKey = 'default_service_key';
  }

  // Step 1: Login
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.appId,
        'X-Service-Key': this.serviceKey
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('OTP sent to email');
      return true;
    }
    throw new Error(result.message);
  }

  // Step 2: Verify OTP
  async verifyOTP(email, otpCode) {
    const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': this.appId,
        'X-Service-Key': this.serviceKey
      },
      body: JSON.stringify({ email, otpCode })
    });

    const result = await response.json();
    
    if (result.success) {
      // Save token
      const token = result.data.session.token;
      localStorage.setItem('jwt_token', token);
      return token;
    }
    throw new Error(result.message);
  }

  // Step 3: Get Profile
  async getMyProfile() {
    const token = localStorage.getItem('jwt_token');
    
    const response = await fetch(`${this.baseURL}/my-profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message);
  }
}

// Usage Example
const auth = new AuthManager();

// Login flow
async function completeLogin() {
  try {
    // 1. Send login request
    await auth.login('user@example.com', 'password123');
    
    // 2. Get OTP from user input
    const otpCode = prompt('Enter OTP from email:');
    
    // 3. Verify OTP and get token
    const token = await auth.verifyOTP('user@example.com', otpCode);
    console.log('Login successful, token saved');
    
    // 4. Get profile
    const profile = await auth.getMyProfile();
    console.log('Profile loaded:', profile);
    
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

---

## ⚠️ Error Handling

### Common Error Responses

| Status Code | Error | Solution |
|-------------|-------|----------|
| `401` | `"Invalid token"` | Token is invalid or expired. User needs to login again. |
| `401` | `"No token provided"` | Authorization header missing. Include JWT token. |
| `404` | `"Profile not found"` | User profile doesn't exist in database. |
| `500` | `"Failed to retrieve profile"` | Server error. Check server logs. |

### Error Handling Example

```javascript
async function getMyProfile() {
  const token = localStorage.getItem('jwt_token');

  try {
    const response = await fetch('http://localhost:3000/api/my-profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();

    // Handle different error cases
    if (!result.success) {
      switch (response.status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Session expired. Please login again.');
          localStorage.removeItem('jwt_token');
          window.location.href = '/login';
          break;
          
        case 404:
          // Profile not found
          console.error('Profile not found');
          break;
          
        case 500:
          // Server error
          console.error('Server error. Please try again later.');
          break;
          
        default:
          console.error('Error:', result.message);
      }
      return null;
    }

    return result.data;
    
  } catch (error) {
    // Network error
    console.error('Network error:', error);
    alert('Cannot connect to server. Please check your internet connection.');
    return null;
  }
}
```

---

## ✅ Quick Checklist

Before calling GET My Profile API, make sure:

- [ ] User has logged in successfully
- [ ] JWT token is stored in localStorage or state management
- [ ] Authorization header includes `Bearer YOUR_JWT_TOKEN`
- [ ] Token is not expired (valid for 24 hours from login)
- [ ] API base URL is correct (`http://localhost:3000`)
- [ ] Handle 401 errors by redirecting to login
- [ ] Display loading state while fetching
- [ ] Handle null values in profile fields

---

## 🎯 Summary

### Required for GET My Profile:
✅ **JWT Token** - From login/OTP verification (in `Authorization` header)

### NOT Required for GET My Profile:
❌ **App ID** - Not needed
❌ **Service Key** - Not needed
❌ **Request Body** - No body needed (GET request)

### Required for Login (to get JWT Token):
✅ **App ID** - `default_app_id` (in `X-App-Id` header)
✅ **Service Key** - `default_service_key` (in `X-Service-Key` header)

---

## 🔗 API Endpoints Quick Reference

```
Login Flow (requires App credentials):
├─ POST /api/auth/login
│  └─ Headers: X-App-Id, X-Service-Key
└─ POST /api/auth/verify-otp
   └─ Headers: X-App-Id, X-Service-Key
   └─ Returns: JWT token

Profile API (requires JWT only):
└─ GET /api/my-profile
   └─ Headers: Authorization: Bearer <JWT_TOKEN>
   └─ Returns: User profile data
```

---

## 🎉 Ready to Use!

You now have everything you need to implement the GET My Profile API in your frontend!

**Base URL:** `http://localhost:3000/api/my-profile`

**Required:** JWT Token only

**Returns:** Complete user profile data

✅ **Tested and working!**


