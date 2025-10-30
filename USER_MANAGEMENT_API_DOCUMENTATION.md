# 👥 User Management API Documentation

## Overview
Complete admin-only user management system with CRUD operations, statistics, and user account management features.

---

## 🔐 Authentication
All user management APIs require:
- **JWT Token** in `Authorization: Bearer <token>` header
- **Admin Role** - Only users with `admin` role can access these endpoints

---

## 📋 API Endpoints

### 1. Get All Users (with Pagination & Filters)

**Endpoint:** `GET /api/user-management/users`

**Description:** Retrieve all users with their profiles, with pagination, search, and filtering capabilities.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page |
| `search` | string | - | Search by email, first name, or last name |
| `role` | string | - | Filter by role (`admin`, `user`, `moderator`) |
| `status` | string | - | Filter by status (`active`, `inactive`) |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/user-management/users?page=1&limit=20&search=john&role=user&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 11,
        "email": "john@example.com",
        "role": "user",
        "is_email_verified": 1,
        "login_attempts": 0,
        "locked_until": null,
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
        "profile_created_at": "2024-01-01 00:00:00",
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 2. Get User Statistics

**Endpoint:** `GET /api/user-management/statistics`

**Description:** Get comprehensive user statistics and analytics.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/user-management/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "activeUsers": 120,
      "inactiveUsers": 30,
      "recentRegistrations": 15,
      "recentActiveLogins": 85
    },
    "roleDistribution": [
      { "role": "admin", "count": 5 },
      { "role": "user", "count": 130 },
      { "role": "moderator", "count": 15 }
    ],
    "recentUsers": [
      {
        "id": 150,
        "email": "newuser@example.com",
        "role": "user",
        "first_name": "New",
        "last_name": "User",
        "created_at": "2024-01-20 15:30:00"
      }
    ],
    "mostActiveUsers": [
      {
        "id": 11,
        "email": "active@example.com",
        "role": "user",
        "first_name": "Active",
        "last_name": "User",
        "last_login": "2024-01-20 14:00:00"
      }
    ]
  }
}
```

---

### 3. Get User by ID

**Endpoint:** `GET /api/user-management/users/:userId`

**Description:** Get detailed information about a specific user.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/user-management/users/11" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 11,
    "email": "john@example.com",
    "role": "user",
    "is_email_verified": 1,
    "login_attempts": 0,
    "locked_until": null,
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
    "profile_updated_at": "2024-01-15 10:00:00",
    "status": "active"
  }
}
```

---

### 4. Update User (Email & Role)

**Endpoint:** `PUT /api/user-management/users/:userId`

**Description:** Update user's email address and/or role.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "role": "moderator"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/user-management/users/11" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "role": "moderator"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### 5. Update User Profile

**Endpoint:** `PUT /api/user-management/users/:userId/profile`

**Description:** Update user's profile information (name, contact details, etc.).

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
curl -X PUT "http://localhost:3000/api/user-management/users/11/profile" \
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
  "message": "User profile updated successfully"
}
```

---

### 6. Activate User

**Endpoint:** `POST /api/user-management/users/:userId/activate`

**Description:** Activate a user account (verify email and unlock account).

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/user-management/users/11/activate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### 7. Deactivate User

**Endpoint:** `POST /api/user-management/users/:userId/deactivate`

**Description:** Deactivate a user account (lock the account).

**Request Body (Optional):**
```json
{
  "reason": "Violated terms of service"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/user-management/users/11/deactivate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Account suspended for review"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "reason": "Account suspended for review"
}
```

---

### 8. Send Password Reset Email

**Endpoint:** `POST /api/user-management/users/:userId/send-password-reset`

**Description:** Send a password reset email to the user.

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/user-management/users/11/send-password-reset" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "john@example.com"
  }
}
```

---

### 9. Delete User

**Endpoint:** `DELETE /api/user-management/users/:userId`

**Description:** Permanently delete a user account (hard delete).

**⚠️ Warning:** This action cannot be undone. Admin cannot delete their own account.

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/user-management/users/11" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 🎯 Use Cases

### Use Case 1: Search for Users by Name
```bash
GET /api/user-management/users?search=john&page=1&limit=10
```

### Use Case 2: Get All Inactive Users
```bash
GET /api/user-management/users?status=inactive&page=1
```

### Use Case 3: Update User Email
```bash
PUT /api/user-management/users/11
Body: { "email": "newemail@example.com" }
```

### Use Case 4: Change User Role to Admin
```bash
PUT /api/user-management/users/11
Body: { "role": "admin" }
```

### Use Case 5: Update User Name
```bash
PUT /api/user-management/users/11/profile
Body: { "first_name": "John", "last_name": "Smith" }
```

### Use Case 6: Deactivate User Account
```bash
POST /api/user-management/users/11/deactivate
Body: { "reason": "Suspended for review" }
```

### Use Case 7: Reactivate User Account
```bash
POST /api/user-management/users/11/activate
```

### Use Case 8: Send Password Reset to User
```bash
POST /api/user-management/users/11/send-password-reset
```

---

## 📊 Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid data) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (not admin) |
| 404 | User not found |
| 500 | Server error |

---

## 🔒 Security Features

1. **Admin-Only Access**: All endpoints require admin role
2. **JWT Authentication**: Secure token-based authentication
3. **Self-Protection**: Admin cannot delete their own account
4. **Email Uniqueness**: Prevents duplicate email addresses
5. **Audit Trail**: All updates are timestamped

---

## 📈 Statistics Overview

The statistics endpoint provides:
- **Total Users**: Overall user count
- **Active Users**: Users with verified email and not locked
- **Inactive Users**: Users not verified or locked
- **Recent Registrations**: New users in last 30 days
- **Recent Active Logins**: Users who logged in within last 7 days
- **Role Distribution**: Count of users per role
- **Recent Users**: 10 most recently registered users
- **Most Active Users**: 10 users with most recent logins

---

## 🚀 Frontend Integration Example

### React/JavaScript Example:

```javascript
// API Client
const API_BASE = 'http://localhost:3000/api/user-management';
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
  'Content-Type': 'application/json'
});

// Get all users
async function getAllUsers(page = 1, search = '', role = '', status = '') {
  const params = new URLSearchParams({ page, limit: 20, search, role, status });
  const response = await fetch(`${API_BASE}/users?${params}`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

// Get statistics
async function getStatistics() {
  const response = await fetch(`${API_BASE}/statistics`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

// Update user
async function updateUser(userId, data) {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

// Activate user
async function activateUser(userId) {
  const response = await fetch(`${API_BASE}/users/${userId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
}

// Deactivate user
async function deactivateUser(userId, reason) {
  const response = await fetch(`${API_BASE}/users/${userId}/deactivate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason })
  });
  return response.json();
}

// Send password reset
async function sendPasswordReset(userId) {
  const response = await fetch(`${API_BASE}/users/${userId}/send-password-reset`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
}
```

---

## ✅ Complete API List

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user-management/users` | Get all users with pagination & filters |
| GET | `/api/user-management/statistics` | Get user statistics & analytics |
| GET | `/api/user-management/users/:userId` | Get single user details |
| PUT | `/api/user-management/users/:userId` | Update user email & role |
| PUT | `/api/user-management/users/:userId/profile` | Update user profile |
| POST | `/api/user-management/users/:userId/activate` | Activate user account |
| POST | `/api/user-management/users/:userId/deactivate` | Deactivate user account |
| POST | `/api/user-management/users/:userId/send-password-reset` | Send password reset email |
| DELETE | `/api/user-management/users/:userId` | Delete user account |

---

## 🎉 All Features Included

✅ List all users with pagination  
✅ Search users by email, first name, last name  
✅ Filter by role (admin, user, moderator)  
✅ Filter by status (active, inactive)  
✅ View user statistics and analytics  
✅ Update user email  
✅ Update user role  
✅ Update user profile (name, contact details)  
✅ Activate user accounts  
✅ Deactivate user accounts  
✅ Send password reset emails  
✅ Delete user accounts  
✅ View total, active, inactive user counts  
✅ View recent registrations  
✅ View most active users  
✅ Admin-only access control  

---

**Ready to use! 🚀**
