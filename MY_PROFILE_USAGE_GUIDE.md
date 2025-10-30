# 👤 My Profile API - Complete Usage Guide

## 🎯 What is My Profile API?

The My Profile API allows **any logged-in user** to manage their own profile. Users can:
- ✅ View their profile
- ✅ Update their name, phone, address
- ✅ Change their email
- ✅ Request password reset
- ✅ Change password

**Important:** Users can **ONLY** access and modify **their own** data, not other users' data.

---

## 🚀 Quick Start

### Step 1: Login to Get JWT Token

```javascript
// Login
POST http://localhost:3000/api/auth/login
Headers:
  X-App-Id: default_app_id
  X-Service-Key: default_service_key
Body:
{
  "email": "user@example.com",
  "password": "YourPassword123"
}

// Verify OTP
POST http://localhost:3000/api/auth/verify-otp
Headers:
  X-App-Id: default_app_id
  X-Service-Key: default_service_key
Body:
{
  "email": "user@example.com",
  "otpCode": "123456"
}

// Response includes JWT token
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Step 2: Use JWT Token for My Profile APIs

All My Profile APIs require the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 API Endpoints & Usage

### 1️⃣ Get My Profile

**What it does:** Returns all your profile information

**Endpoint:** `GET /api/my-profile`

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/my-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();

if (result.success) {
  console.log('My profile:', result.data);
  console.log('My name:', result.data.first_name, result.data.last_name);
  console.log('My email:', result.data.email);
  console.log('My role:', result.data.role);
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "email": "user@example.com",
    "role": "user",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  }
}
```

---

### 2️⃣ Update My Profile

**What it does:** Updates your profile information (name, phone, address, etc.)

**Endpoint:** `PUT /api/my-profile`

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/my-profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+9876543210",
    "address": "456 New Street",
    "city": "Los Angeles"
  }'
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '+9876543210',
    address: '456 New Street',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    postal_code: '90001'
  })
});

const result = await response.json();

if (result.success) {
  alert('Profile updated successfully!');
}
```

**Fields You Can Update:**
- `first_name` - First name
- `last_name` - Last name
- `phone` - Phone number
- `date_of_birth` - Date of birth (YYYY-MM-DD)
- `address` - Street address
- `city` - City
- `state` - State/Province
- `country` - Country
- `postal_code` - Postal/ZIP code
- `avatar_url` - Avatar image URL
- `bio` - Biography/About me
- `website` - Personal website URL

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 3️⃣ Update My Email

**What it does:** Changes your email address

**⚠️ Important:** After changing email, you'll need to verify the new email address.

**Endpoint:** `PUT /api/my-profile/email`

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/my-profile/email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile/email', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newemail@example.com'
  })
});

const result = await response.json();

if (result.success) {
  alert('Email updated! Please check your new email for verification.');
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully. Please verify your new email address."
}
```

**Error (Email Already Exists):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### 4️⃣ Request Password Reset

**What it does:** Sends you an email with a password reset link

**Endpoint:** `POST /api/my-profile/request-password-reset`

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/my-profile/request-password-reset" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile/request-password-reset', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();

if (result.success) {
  alert(`Password reset email sent to ${result.data.email}. Please check your inbox.`);
}
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

**What Happens Next:**
1. You receive an email with a reset link
2. Link looks like: `http://localhost:3000/reset-password?token=...`
3. Click the link to open password reset page
4. Enter new password
5. Password is reset!

---

### 5️⃣ Change Password

**What it does:** Changes your password (requires your current password)

**Endpoint:** `POST /api/my-profile/change-password`

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/my-profile/change-password" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "CurrentPass123",
    "newPassword": "NewPass456"
  }'
```

**JavaScript Example:**
```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile/change-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    oldPassword: 'CurrentPass123',
    newPassword: 'NewPass456'
  })
});

const result = await response.json();

if (result.success) {
  alert('Password changed successfully!');
} else {
  alert('Error: ' + result.message);
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Wrong Old Password):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## 🎨 Complete Frontend Example (HTML + JavaScript)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Profile</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .info { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>👤 My Profile</h1>

    <!-- Profile Information -->
    <div class="section">
        <h2>Profile Information</h2>
        <div class="info">
            <strong>Email:</strong> <span id="email">Loading...</span>
        </div>
        <div class="info">
            <strong>Role:</strong> <span id="role">Loading...</span>
        </div>
        <div class="info">
            <strong>Name:</strong> <span id="name">Loading...</span>
        </div>
        <div class="info">
            <strong>Phone:</strong> <span id="phone">Loading...</span>
        </div>
        <button onclick="loadProfile()">Refresh Profile</button>
    </div>

    <!-- Update Profile -->
    <div class="section">
        <h2>Update Profile</h2>
        <input type="text" id="firstName" placeholder="First Name">
        <input type="text" id="lastName" placeholder="Last Name">
        <input type="tel" id="phoneNumber" placeholder="Phone Number">
        <input type="text" id="address" placeholder="Address">
        <input type="text" id="city" placeholder="City">
        <input type="text" id="state" placeholder="State">
        <input type="text" id="country" placeholder="Country">
        <button onclick="updateProfile()">Save Changes</button>
    </div>

    <!-- Change Email -->
    <div class="section">
        <h2>Change Email</h2>
        <input type="email" id="newEmail" placeholder="New Email Address">
        <button onclick="changeEmail()">Update Email</button>
    </div>

    <!-- Password Management -->
    <div class="section">
        <h2>Password Management</h2>
        <h3>Option 1: Request Password Reset Email</h3>
        <p>We'll send you an email with a reset link</p>
        <button onclick="requestPasswordReset()">Send Reset Email</button>

        <h3>Option 2: Change Password (if you know current password)</h3>
        <input type="password" id="oldPassword" placeholder="Current Password">
        <input type="password" id="newPassword" placeholder="New Password">
        <input type="password" id="confirmPassword" placeholder="Confirm New Password">
        <button onclick="changePassword()">Change Password</button>
    </div>

    <script>
        const API_BASE = 'http://localhost:3000/api/my-profile';
        const token = localStorage.getItem('jwt_token');

        if (!token) {
            alert('Please login first');
            window.location.href = '/';
        }

        function getHeaders() {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }

        // Load profile
        async function loadProfile() {
            try {
                const response = await fetch(API_BASE, {
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const data = result.data;
                    
                    // Display profile
                    document.getElementById('email').textContent = data.email;
                    document.getElementById('role').textContent = data.role;
                    document.getElementById('name').textContent = 
                        `${data.first_name || ''} ${data.last_name || ''}`;
                    document.getElementById('phone').textContent = data.phone || 'Not set';
                    
                    // Fill form
                    document.getElementById('firstName').value = data.first_name || '';
                    document.getElementById('lastName').value = data.last_name || '';
                    document.getElementById('phoneNumber').value = data.phone || '';
                    document.getElementById('address').value = data.address || '';
                    document.getElementById('city').value = data.city || '';
                    document.getElementById('state').value = data.state || '';
                    document.getElementById('country').value = data.country || '';
                    
                    console.log('✅ Profile loaded:', data);
                } else {
                    alert('Failed to load profile: ' + result.message);
                }
            } catch (error) {
                alert('Error loading profile: ' + error.message);
            }
        }

        // Update profile
        async function updateProfile() {
            try {
                const response = await fetch(API_BASE, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        first_name: document.getElementById('firstName').value,
                        last_name: document.getElementById('lastName').value,
                        phone: document.getElementById('phoneNumber').value,
                        address: document.getElementById('address').value,
                        city: document.getElementById('city').value,
                        state: document.getElementById('state').value,
                        country: document.getElementById('country').value
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Profile updated successfully!');
                    loadProfile(); // Reload to show changes
                } else {
                    alert('❌ Failed to update profile: ' + result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        // Change email
        async function changeEmail() {
            const newEmail = document.getElementById('newEmail').value;
            
            if (!newEmail) {
                alert('Please enter a new email address');
                return;
            }
            
            if (!confirm(`Change your email to ${newEmail}? You'll need to verify the new email.`)) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/email`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({ email: newEmail })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Email updated successfully! Please check your new email for verification.');
                    loadProfile();
                } else {
                    alert('❌ Failed to update email: ' + result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        // Request password reset
        async function requestPasswordReset() {
            if (!confirm('Send password reset email to your registered email?')) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/request-password-reset`, {
                    method: 'POST',
                    headers: getHeaders()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ Password reset email sent to ${result.data.email}!\n\nPlease check your inbox and click the link to reset your password.`);
                } else {
                    alert('❌ Failed to send reset email: ' + result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        // Change password
        async function changePassword() {
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate inputs
            if (!oldPassword || !newPassword || !confirmPassword) {
                alert('Please fill in all password fields');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }
            
            if (newPassword.length < 8) {
                alert('New password must be at least 8 characters long');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/change-password`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        oldPassword: oldPassword,
                        newPassword: newPassword
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Password changed successfully!');
                    // Clear password fields
                    document.getElementById('oldPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                } else {
                    alert('❌ Failed to change password: ' + result.message);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        // Load profile on page load
        window.onload = loadProfile;
    </script>
</body>
</html>
```

---

## 🔄 Common Scenarios

### Scenario 1: User Updates Their Name

```javascript
// User wants to change name from "John Doe" to "Jane Smith"

const token = localStorage.getItem('jwt_token');

await fetch('http://localhost:3000/api/my-profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Jane',
    last_name: 'Smith'
  })
});

// ✅ Name updated!
```

### Scenario 2: User Forgot Password

```javascript
// User clicks "Forgot Password" button

const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/my-profile/request-password-reset', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ Email sent with reset link
// User clicks link in email
// Opens: http://localhost:3000/reset-password?token=...
// User enters new password
// ✅ Password reset complete!
```

### Scenario 3: User Changes Password (Knows Old Password)

```javascript
// User wants to change password

const token = localStorage.getItem('jwt_token');

await fetch('http://localhost:3000/api/my-profile/change-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    oldPassword: 'OldPass123',
    newPassword: 'NewPass456'
  })
});

// ✅ Password changed immediately!
```

### Scenario 4: User Updates Contact Information

```javascript
// User wants to update phone and address

const token = localStorage.getItem('jwt_token');

await fetch('http://localhost:3000/api/my-profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '+1234567890',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    postal_code: '10001'
  })
});

// ✅ Contact info updated!
```

---

## ⚛️ React Component Example

```jsx
// MyProfilePage.jsx
import React, { useState, useEffect } from 'react';

function MyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const token = localStorage.getItem('jwt_token');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const response = await fetch('http://localhost:3000/api/my-profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (result.success) {
      setProfile(result.data);
      setFormData(result.data);
    }
  };

  const handleSave = async () => {
    const response = await fetch('http://localhost:3000/api/my-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Profile updated!');
      setEditing(false);
      loadProfile();
    }
  };

  const handlePasswordReset = async () => {
    const response = await fetch('http://localhost:3000/api/my-profile/request-password-reset', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (result.success) {
      alert(`Reset email sent to ${result.data.email}`);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Profile</h1>
      
      <div>
        <p>Email: {profile.email}</p>
        <p>Role: {profile.role}</p>
        <p>Name: {profile.first_name} {profile.last_name}</p>
        <p>Phone: {profile.phone || 'Not set'}</p>
      </div>

      {editing ? (
        <div>
          <input
            value={formData.first_name || ''}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            placeholder="First Name"
          />
          <input
            value={formData.last_name || ''}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            placeholder="Last Name"
          />
          <input
            value={formData.phone || ''}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="Phone"
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
          <button onClick={handlePasswordReset}>Reset Password</button>
        </div>
      )}
    </div>
  );
}

export default MyProfilePage;
```

---

## 📊 API Summary Table

| API | What It Does | Who Can Use | Example |
|-----|--------------|-------------|---------|
| `GET /api/my-profile` | View my profile | Any user | See my name, email, phone |
| `PUT /api/my-profile` | Update my profile | Any user | Change my name, phone |
| `PUT /api/my-profile/email` | Change my email | Any user | Update email address |
| `POST /api/my-profile/request-password-reset` | Get reset email | Any user | Forgot password |
| `POST /api/my-profile/change-password` | Change password | Any user | Update password |

---

## ✅ Testing Checklist

Test these scenarios:

- [ ] Login and get JWT token
- [ ] View my profile (`GET /api/my-profile`)
- [ ] Update my name (`PUT /api/my-profile`)
- [ ] Update my phone (`PUT /api/my-profile`)
- [ ] Update my address (`PUT /api/my-profile`)
- [ ] Change my email (`PUT /api/my-profile/email`)
- [ ] Request password reset (`POST /api/my-profile/request-password-reset`)
- [ ] Receive email with reset link
- [ ] Click link and reset password
- [ ] Change password with old password (`POST /api/my-profile/change-password`)

---

## 🎉 Ready to Use!

**Base URL:** `http://localhost:3000/api/my-profile`

**Authentication:** JWT Token (any role)

**Access:** Self-service only (own data)

**All APIs are working and ready for frontend integration!** 👤✨



