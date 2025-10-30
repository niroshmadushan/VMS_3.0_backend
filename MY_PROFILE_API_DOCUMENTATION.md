# 👤 My Profile API Documentation

## Overview
Self-service profile management APIs where any authenticated user can view and update their own profile, email, and password. **Users can only access and modify their own data.**

---

## 🔐 Authentication
All My Profile APIs require:
- **JWT Token** in `Authorization: Bearer <token>` header
- **Any Role** - All authenticated users (admin, user, moderator) can access
- **Self-Service Only** - Users can only view/edit their own profile

---

## 📋 API Endpoints

### 1. Get My Profile

**Endpoint:** `GET /api/my-profile`

**Description:** Get current user's complete profile information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/my-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "email": "user@example.com",
    "role": "user",
    "is_email_verified": 1,
    "last_login": "2024-01-15 10:30:00",
    "user_created_at": "2024-01-01 00:00:00",
    "user_updated_at": "2024-01-15 10:30:00",
    "profile_id": 5,
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "Software developer",
    "website": "https://johndoe.com",
    "social_links": {},
    "preferences": {},
    "custom_fields": {},
    "profile_created_at": "2024-01-01 00:00:00",
    "profile_updated_at": "2024-01-15 10:00:00"
  }
}
```

---

### 2. Update My Profile

**Endpoint:** `PUT /api/my-profile`

**Description:** Update current user's profile information (name, contact details, etc.).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "address": "456 New St",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "postal_code": "90001",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "bio": "Updated bio",
  "website": "https://johnsmith.com"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/my-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 3. Update My Email

**Endpoint:** `PUT /api/my-profile/email`

**Description:** Update current user's email address. **Note:** Email will need to be re-verified.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@example.com"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/my-profile/email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully. Please verify your new email address."
}
```

---

### 4. Request Password Reset

**Endpoint:** `POST /api/my-profile/request-password-reset`

**Description:** Request a password reset email for current user. User will receive an email with a reset link.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/my-profile/request-password-reset" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

**Email Contains:**
- Clickable reset link: `http://localhost:3000/reset-password?token=...`
- Link expires in 1 hour
- Opens password reset page

---

### 5. Change Password

**Endpoint:** `POST /api/my-profile/change-password`

**Description:** Change current user's password (requires current password for security).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "oldPassword": "CurrentPass123",
  "newPassword": "NewPass123"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/my-profile/change-password" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "CurrentPass123",
    "newPassword": "NewPass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (Wrong Old Password):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## 🎯 Use Cases

### Use Case 1: View My Profile
```javascript
GET /api/my-profile
```
Returns all profile information for the logged-in user.

### Use Case 2: Update My Name
```javascript
PUT /api/my-profile
Body: { "first_name": "John", "last_name": "Smith" }
```

### Use Case 3: Update My Contact Info
```javascript
PUT /api/my-profile
Body: { "phone": "+1234567890", "address": "123 Main St" }
```

### Use Case 4: Change My Email
```javascript
PUT /api/my-profile/email
Body: { "email": "newemail@example.com" }
```

### Use Case 5: Forgot Password (Self-Service)
```javascript
POST /api/my-profile/request-password-reset
```
User receives email with reset link.

### Use Case 6: Change Password (Knowing Old Password)
```javascript
POST /api/my-profile/change-password
Body: { "oldPassword": "old", "newPassword": "new" }
```

---

## 🔒 Security Features

### **Self-Service Only:**
- ✅ Users can only access their own profile
- ✅ User ID is extracted from JWT token
- ✅ Cannot view or modify other users' data

### **Authentication Required:**
- ✅ All endpoints require valid JWT token
- ✅ Token must be active and not expired
- ✅ Session must be valid in database

### **Email Update Security:**
- ✅ Checks for duplicate emails
- ✅ Marks email as unverified after change
- ✅ Requires re-verification

### **Password Change Security:**
- ✅ Requires current password verification
- ✅ New password is hashed with bcrypt
- ✅ 12 rounds of hashing

### **Password Reset Security:**
- ✅ Generates secure random token
- ✅ Token expires in 1 hour
- ✅ Single-use token
- ✅ Sent to user's registered email

---

## 📊 Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid data, wrong password) |
| 401 | Unauthorized (no token or invalid token) |
| 404 | Profile not found |
| 500 | Server error |

---

## 🚀 Frontend Integration

### JavaScript API Client

```javascript
// services/MyProfileAPI.js

class MyProfileAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/my-profile';
    this.token = localStorage.getItem('jwt_token') || '';
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Get my profile
  async getProfile() {
    const response = await fetch(this.baseURL, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Update my profile
  async updateProfile(profileData) {
    const response = await fetch(this.baseURL, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    });
    return response.json();
  }

  // Update my email
  async updateEmail(newEmail) {
    const response = await fetch(`${this.baseURL}/email`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: newEmail })
    });
    return response.json();
  }

  // Request password reset
  async requestPasswordReset() {
    const response = await fetch(`${this.baseURL}/request-password-reset`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Change password
  async changePassword(oldPassword, newPassword) {
    const response = await fetch(`${this.baseURL}/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return response.json();
  }
}

export default new MyProfileAPI();
```

### React Component Example

```jsx
// components/MyProfile.jsx
import React, { useState, useEffect } from 'react';
import MyProfileAPI from '../services/MyProfileAPI';

function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
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
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await MyProfileAPI.getProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          country: response.data.country || '',
          postal_code: response.data.postal_code || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await MyProfileAPI.updateProfile(formData);
      if (response.success) {
        alert('Profile updated successfully!');
        setEditing(false);
        loadProfile();
      }
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!confirm('Send password reset email to your registered email?')) return;
    
    try {
      const response = await MyProfileAPI.requestPasswordReset();
      if (response.success) {
        alert(`Password reset email sent to ${response.data.email}`);
      }
    } catch (error) {
      alert('Failed to send password reset: ' + error.message);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="my-profile">
      <h2>My Profile</h2>
      
      <div className="profile-info">
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Member Since:</strong> {new Date(profile.user_created_at).toLocaleDateString()}</p>
      </div>

      {editing ? (
        <div className="edit-form">
          <input
            type="text"
            placeholder="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          
          <button onClick={handleSave}>Save Changes</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="profile-display">
          <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
          <p><strong>Address:</strong> {profile.address || 'Not set'}</p>
          
          <button onClick={() => setEditing(true)}>Edit Profile</button>
          <button onClick={handleRequestPasswordReset}>Reset Password</button>
        </div>
      )}
    </div>
  );
}

export default MyProfile;
```

---

## ✅ Complete API List

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/my-profile` | Get my profile | Any authenticated user |
| PUT | `/api/my-profile` | Update my profile | Any authenticated user |
| PUT | `/api/my-profile/email` | Update my email | Any authenticated user |
| POST | `/api/my-profile/request-password-reset` | Request password reset | Any authenticated user |
| POST | `/api/my-profile/change-password` | Change password | Any authenticated user |

---

## 🔄 Complete User Flow Examples

### Flow 1: User Updates Their Profile

```javascript
// 1. Get current profile
const profile = await MyProfileAPI.getProfile();
console.log('Current name:', profile.data.first_name);

// 2. Update profile
await MyProfileAPI.updateProfile({
  first_name: 'Jane',
  last_name: 'Doe',
  phone: '+9876543210'
});

// 3. Reload profile to see changes
const updated = await MyProfileAPI.getProfile();
console.log('New name:', updated.data.first_name);
```

### Flow 2: User Changes Email

```javascript
// Update email
await MyProfileAPI.updateEmail('newemail@example.com');

// Note: User will need to verify new email
// is_email_verified will be set to 0
```

### Flow 3: User Forgot Password (Self-Service)

```javascript
// Request password reset
const response = await MyProfileAPI.requestPasswordReset();

// User receives email with link:
// http://localhost:3000/reset-password?token=...

// User clicks link, enters new password
// Password is reset without needing admin
```

### Flow 4: User Changes Password (Knows Old Password)

```javascript
// Change password
await MyProfileAPI.changePassword('OldPass123', 'NewPass456');

// If old password is wrong, returns error
// If successful, password is immediately changed
```

---

## 🎨 Vanilla JavaScript Example

```javascript
// Get profile
async function loadMyProfile() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('http://localhost:3000/api/my-profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('My profile:', result.data);
    document.getElementById('userName').textContent = 
      `${result.data.first_name} ${result.data.last_name}`;
    document.getElementById('userEmail').textContent = result.data.email;
  }
}

// Update profile
async function updateMyProfile() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('http://localhost:3000/api/my-profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first_name: document.getElementById('firstName').value,
      last_name: document.getElementById('lastName').value,
      phone: document.getElementById('phone').value
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('Profile updated successfully!');
    loadMyProfile(); // Reload
  }
}

// Request password reset
async function requestPasswordReset() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('http://localhost:3000/api/my-profile/request-password-reset', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert(`Password reset email sent to ${result.data.email}`);
  }
}
```

---

## 🆚 Difference: My Profile vs User Management

### **My Profile APIs** (`/api/my-profile`)
- ✅ **Any authenticated user** can access
- ✅ Users can only view/edit **their own** profile
- ✅ Self-service profile management
- ✅ Self-service password reset
- ✅ No admin privileges required

### **User Management APIs** (`/api/user-management`)
- ❌ **Admin only**
- ✅ Admin can view/edit **any user's** profile
- ✅ Admin can activate/deactivate users
- ✅ Admin can delete users
- ✅ Admin can send password resets to others

---

## 📱 Complete Frontend Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Profile</title>
</head>
<body>
    <h1>My Profile</h1>
    
    <div id="profileView">
        <p>Name: <span id="userName"></span></p>
        <p>Email: <span id="userEmail"></span></p>
        <p>Phone: <span id="userPhone"></span></p>
        
        <button onclick="showEditForm()">Edit Profile</button>
        <button onclick="requestPasswordReset()">Reset Password</button>
    </div>

    <div id="editForm" style="display: none;">
        <input type="text" id="firstName" placeholder="First Name">
        <input type="text" id="lastName" placeholder="Last Name">
        <input type="tel" id="phone" placeholder="Phone">
        
        <button onclick="saveProfile()">Save</button>
        <button onclick="cancelEdit()">Cancel</button>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000/api/my-profile';
        const token = localStorage.getItem('jwt_token');

        async function loadProfile() {
            const response = await fetch(API_BASE, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('userName').textContent = 
                    `${result.data.first_name} ${result.data.last_name}`;
                document.getElementById('userEmail').textContent = result.data.email;
                document.getElementById('userPhone').textContent = result.data.phone || 'Not set';
                
                document.getElementById('firstName').value = result.data.first_name || '';
                document.getElementById('lastName').value = result.data.last_name || '';
                document.getElementById('phone').value = result.data.phone || '';
            }
        }

        function showEditForm() {
            document.getElementById('profileView').style.display = 'none';
            document.getElementById('editForm').style.display = 'block';
        }

        function cancelEdit() {
            document.getElementById('profileView').style.display = 'block';
            document.getElementById('editForm').style.display = 'none';
        }

        async function saveProfile() {
            const response = await fetch(API_BASE, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: document.getElementById('firstName').value,
                    last_name: document.getElementById('lastName').value,
                    phone: document.getElementById('phone').value
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Profile updated successfully!');
                cancelEdit();
                loadProfile();
            }
        }

        async function requestPasswordReset() {
            if (!confirm('Send password reset email?')) return;
            
            const response = await fetch(`${API_BASE}/request-password-reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`Password reset email sent to ${result.data.email}`);
            }
        }

        // Load profile on page load
        loadProfile();
    </script>
</body>
</html>
```

---

## ✅ Features Summary

### **Profile Management:**
- ✅ View own profile
- ✅ Update name, phone, address
- ✅ Update avatar, bio, website
- ✅ Update all profile fields

### **Email Management:**
- ✅ Update email address
- ✅ Duplicate email check
- ✅ Requires re-verification after change

### **Password Management:**
- ✅ Self-service password reset (via email)
- ✅ Change password (with old password)
- ✅ Secure password hashing

### **Security:**
- ✅ Self-service only (own data)
- ✅ JWT authentication required
- ✅ Cannot access other users' data
- ✅ All roles can use (admin, user, moderator)

---

## 🎉 Ready to Use!

All My Profile APIs are **production-ready** and can be used by any authenticated user to manage their own profile!

**Base URL:** `http://localhost:3000/api/my-profile`

**Test it:**
1. Login to get JWT token
2. Call `GET /api/my-profile` to see your profile
3. Call `PUT /api/my-profile` to update your profile
4. Call `POST /api/my-profile/request-password-reset` to get reset email

---

**Self-service profile management is now available for all users!** 👤✨



