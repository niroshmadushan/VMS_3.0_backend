# Secure SELECT API - Data Fetching Guide

## 🎯 Quick Start

### 1. Authentication (Get JWT Token)

**⚠️ IMPORTANT: All authentication endpoints require App Credentials!**

```bash
# Step 1: Login (sends OTP to email)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{
    "email": "niroshmax01@gmail.com",
    "password": "Nir@2000313"
  }'

# Step 2: Verify OTP (get JWT token)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{
    "email": "niroshmax01@gmail.com",
    "otpCode": "123456"
  }'
```

**🔑 App Credentials Required for:**
- `POST /api/auth/login`
- `POST /api/auth/verify-otp`
- `POST /api/auth/signup`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 11,
      "email": "niroshmax01@gmail.com",
      "role": "admin"
    },
    "session": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-10-01T03:11:36.298Z"
    }
  }
}
```

### 2. Use JWT Token for API Calls

```bash
# Save your token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make API calls with Authorization header
curl -X GET http://localhost:3000/api/secure-select/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Data Fetching Examples

### Basic Data Retrieval

#### 1. Get All Records from a Table
```bash
curl -X GET http://localhost:3000/api/secure-select/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Get Specific Columns Only
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?select=id,email,role,last_login" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Filter by Single Column
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?role=admin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Multiple Filters
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?role=admin&is_email_verified=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Pagination

#### 1. Limit Results
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Pagination with Page
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Offset Pagination
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?offset=20&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Advanced Filtering

#### 1. Text Search
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?email=niroshmax01@gmail.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Numeric Range
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?id[gte]=5&id[lte]=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Date Range
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?created_at[gte]=2025-01-01&created_at[lte]=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Boolean Filters
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?is_email_verified=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Null/Not Null Checks
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?last_login[null]=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Complex Queries

#### 1. Combined Filters with Pagination
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?role=admin&limit=5&page=1&select=id,email,role,last_login" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Search with Date Range
```bash
curl -X GET "http://localhost:3000/api/secure-select/users?role=admin&created_at[gte]=2025-09-01&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🏢 Place Management Tables

### Available Tables
- `places` - Main places data
- `visitors` - Visitor information
- `visits` - Visit records
- `visit_cancellations` - Cancelled visits
- `place_access_logs` - Access logs
- `place_notifications` - Notifications
- `place_statistics` - Statistics
- `active_places` - Active places view
- `todays_visits` - Today's visits view

### Examples

#### 1. Get All Places
```bash
curl -X GET http://localhost:3000/api/secure-select/places \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Get Active Places Only
```bash
curl -X GET "http://localhost:3000/api/secure-select/places?is_active=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Get Places by Type
```bash
curl -X GET "http://localhost:3000/api/secure-select/places?place_type=office" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get Visitors
```bash
curl -X GET "http://localhost:3000/api/secure-select/visitors?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Today's Visits
```bash
curl -X GET "http://localhost:3000/api/secure-select/todays_visits" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 JavaScript/Frontend Examples

### Using Fetch API

```javascript
// 1. Login and get token (requires App Credentials)
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': 'default_app_id',           // ⚠️ REQUIRED
      'X-Service-Key': 'default_service_key'  // ⚠️ REQUIRED
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  console.log('OTP sent to email');
  return data;
}

// 2. Verify OTP and get JWT (requires App Credentials)
async function verifyOTP(email, otpCode) {
  const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': 'default_app_id',           // ⚠️ REQUIRED
      'X-Service-Key': 'default_service_key'  // ⚠️ REQUIRED
    },
    body: JSON.stringify({ email, otpCode })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('jwt_token', data.data.session.token);
    localStorage.setItem('user_role', data.data.user.role);
  }
  return data;
}

// 3. Fetch data with JWT
async function fetchData(table, options = {}) {
  const token = localStorage.getItem('jwt_token');
  const params = new URLSearchParams(options);
  const url = `http://localhost:3000/api/secure-select/${table}?${params}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data;
}

// Usage Examples
async function loadUsers() {
  const users = await fetchData('users', { limit: 10, page: 1 });
  console.log(users.data); // Array of users
  console.log(users.meta); // Pagination info
}

async function loadPlaces() {
  const places = await fetchData('places', { is_active: 1, select: 'id,name,address,place_type' });
  console.log(places.data); // Array of active places
}

async function searchUsers() {
  const users = await fetchData('users', { role: 'admin', email: 'niroshmax01@gmail.com' });
  console.log(users.data); // Filtered users
}
```

### Using Axios

```javascript
import axios from 'axios';

// Set up axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login (requires App Credentials)
async function login(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password
  }, {
    headers: {
      'X-App-Id': 'default_app_id',           // ⚠️ REQUIRED
      'X-Service-Key': 'default_service_key'  // ⚠️ REQUIRED
    }
  });
  return response.data;
}

// Verify OTP (requires App Credentials)
async function verifyOTP(email, otpCode) {
  const response = await api.post('/auth/verify-otp', {
    email,
    otpCode
  }, {
    headers: {
      'X-App-Id': 'default_app_id',           // ⚠️ REQUIRED
      'X-Service-Key': 'default_service_key'  // ⚠️ REQUIRED
    }
  });
  
  if (response.data.success) {
    localStorage.setItem('jwt_token', response.data.data.session.token);
  }
  return response.data;
}

// Fetch data
async function fetchData(table, params = {}) {
  const response = await api.get(`/secure-select/${table}`, { params });
  return response.data;
}

// Usage
async function loadData() {
  try {
    const users = await fetchData('users', { limit: 5, role: 'admin' });
    const places = await fetchData('places', { is_active: 1 });
    
    console.log('Users:', users.data);
    console.log('Places:', places.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
```

---

## 📱 React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function DataTable({ table }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    fetchData();
  }, [table, pagination]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      const response = await fetch(
        `http://localhost:3000/api/secure-select/${table}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setPagination(prev => ({
          ...prev,
          totalPages: result.meta.pagination?.totalPages || 1
        }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{table} Data</h2>
      <table>
        <thead>
          <tr>
            {data.length > 0 && Object.keys(data[0]).map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, i) => (
                <td key={i}>{String(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div>
        <button 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span>Page {pagination.page}</span>
        <button 
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default DataTable;
```

---

## 🔧 Query Parameters Reference

### Pagination
- `page` - Page number (starts from 1)
- `limit` - Records per page (max 1000)
- `offset` - Skip number of records

### Filtering
- `column=value` - Exact match
- `column[gte]=value` - Greater than or equal
- `column[lte]=value` - Less than or equal
- `column[gt]=value` - Greater than
- `column[lt]=value` - Less than
- `column[null]=true/false` - Null check
- `column[in]=value1,value2,value3` - In array
- `column[like]=pattern` - LIKE search

### Selection
- `select=col1,col2,col3` - Select specific columns

### Sorting
- `order=column` - Ascending order
- `order=column:desc` - Descending order

---

## 📊 Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "admin",
      "created_at": "2025-09-30T03:11:36.000Z"
    }
  ],
  "meta": {
    "table": "users",
    "role": "admin",
    "totalRecords": 5,
    "page": 1,
    "limit": 10,
    "hasMore": true,
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 25,
      "recordsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## 🚨 Error Handling

### Common Errors

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Access denied - Insufficient permissions for table: users"
}
```

```json
{
  "success": false,
  "message": "Table not found: invalid_table"
}
```

### Error Handling in JavaScript

```javascript
async function fetchData(table, params = {}) {
  try {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`http://localhost:3000/api/secure-select/${table}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      if (data.message.includes('Unauthorized') || data.message.includes('expired')) {
        // Token expired, redirect to login
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        return;
      }
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 🎯 Quick Reference Commands

```bash
# Step 1: Login (requires App Credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{"email":"niroshmax01@gmail.com","password":"Nir@2000313"}'

# Step 2: Verify OTP (requires App Credentials)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{"email":"niroshmax01@gmail.com","otpCode":"123456"}'

# Step 3: Use JWT Token for data fetching
TOKEN="your_jwt_token_here"

# Basic data fetch (JWT only)
curl -X GET "http://localhost:3000/api/secure-select/users" \
  -H "Authorization: Bearer $TOKEN"

# With filters (JWT only)
curl -X GET "http://localhost:3000/api/secure-select/users?role=admin&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Place data (JWT only)
curl -X GET "http://localhost:3000/api/secure-select/places?is_active=1" \
  -H "Authorization: Bearer $TOKEN"

# Available tables (JWT only)
curl -X GET "http://localhost:3000/api/secure-select/tables" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Success Checklist

- [ ] **Authentication**: Include `X-App-Id` and `X-Service-Key` headers for login/verify-otp
- [ ] **JWT Token**: Include `Authorization: Bearer TOKEN` header for data fetching
- [ ] **App Credentials**: Use correct APP_ID and SERVICE_KEY from config.env
- [ ] **Table Names**: Use correct table names (check `/tables` endpoint)
- [ ] **Pagination**: Handle pagination for large datasets
- [ ] **Error Handling**: Implement error handling for expired tokens
- [ ] **Filters**: Use appropriate filters to reduce data transfer
- [ ] **Roles**: Test with different user roles (admin, employee, reception)

## 🔑 Authentication Summary

| Endpoint Type | Headers Required |
|---------------|------------------|
| **Auth Endpoints** | `X-App-Id` + `X-Service-Key` |
| **Data Endpoints** | `Authorization: Bearer JWT_TOKEN` |

---

**🎉 You're now ready to fetch data from the Secure SELECT API!**
