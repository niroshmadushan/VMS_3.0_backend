# 🔐 SECURE SELECT API - COMPLETE USAGE EXAMPLES WITH JWT TOKENS

## 📋 **Overview**

Complete examples showing how to use the Secure SELECT API with JWT authentication for the Place Management System.

---

## 🔑 **Step 1: Get JWT Token (Login)**

### **Login Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "niroshmax01@gmail.com",
    "password": "12345pass"
  }'
```

### **Login Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3OC1hYmNkLWVmZ2gtaWprbC1tbm9wLTEyMzQ1Njc4Iiwicm9sZSI6ImFkbWluIiwibG9naW5UaW1lIjoiMjAyMy0xMi0yOVQxNzowMDowMC4wMDBaIiwiaWF0IjoxNzAzNzQ2NDAwLCJleHAiOjE3MDM3NTAwMDB9.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "user": {
    "id": "12345678-abcd-efgh-ijkl-mnop-12345678",
    "email": "niroshmax01@gmail.com",
    "role": "admin",
    "isEmailVerified": true
  },
  "refreshToken": "refresh_token_here"
}
```

### **Store the JWT Token:**
```javascript
const jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## 🎯 **Step 2: Use JWT Token in API Requests**

### **Authorization Header Format:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 📊 **Step 3: Secure SELECT API Examples**

### **1. Get Allowed Tables**

```bash
curl -X GET http://localhost:3000/api/secure-select/tables \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "admin",
    "allowedTables": [
      "places",
      "visitors",
      "visits",
      "place_deactivation_reasons",
      "visit_cancellations",
      "place_access_logs",
      "place_notifications",
      "place_statistics",
      "active_places",
      "todays_visits"
    ],
    "tableCount": 10,
    "permissions": {
      "canUseTextSearch": true,
      "canUseNumericRange": true,
      "canUseDateRange": true,
      "canUseBooleanFilter": true,
      "canUseArrayFilter": true,
      "canUseNullCheck": true,
      "canUseCustomQueries": true
    },
    "paginationLimits": {
      "maxLimit": 1000,
      "defaultLimit": 50,
      "maxOffset": 100000
    }
  }
}
```

---

### **2. Get Table Information**

```bash
curl -X GET "http://localhost:3000/api/secure-select/places/info" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "table": "places",
    "role": "admin",
    "columns": [
      {
        "Field": "id",
        "Type": "char(36)",
        "Null": "NO",
        "Key": "PRI",
        "Default": null,
        "Extra": ""
      },
      {
        "Field": "name",
        "Type": "varchar(255)",
        "Null": "NO",
        "Key": "",
        "Default": null,
        "Extra": ""
      }
    ],
    "allowedColumns": ["*"],
    "totalColumns": 15,
    "visibleColumnsCount": 15,
    "filterCapabilities": {
      "textSearch": true,
      "numericRange": true,
      "dateRange": true,
      "booleanFilter": true,
      "arrayFilter": true,
      "nullCheck": true
    }
  }
}
```

---

### **3. Get Places Data (Basic)**

```bash
curl -X GET "http://localhost:3000/api/secure-select/places?limit=5&page=1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "place-123",
      "name": "Main Office",
      "description": "Corporate headquarters",
      "address": "123 Business St",
      "city": "New York",
      "place_type": "office",
      "capacity": 100,
      "is_active": 1,
      "created_at": "2023-12-29T10:00:00.000Z"
    }
  ],
  "meta": {
    "table": "places",
    "role": "admin",
    "totalRecords": 5,
    "page": 1,
    "limit": 5,
    "offset": 0,
    "hasMore": true,
    "filters": null,
    "appliedFilters": 0
  }
}
```

---

### **4. Advanced Filtering - Search Places by City**

```bash
curl -X GET "http://localhost:3000/api/secure-select/places?filters=[{\"column\":\"city\",\"operator\":\"equals\",\"value\":\"New York\"}]" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "place-123",
      "name": "Main Office",
      "city": "New York",
      "place_type": "office",
      "is_active": 1
    }
  ],
  "meta": {
    "table": "places",
    "role": "admin",
    "totalRecords": 1,
    "filters": [
      {
        "column": "city",
        "operator": "equals",
        "value": "New York"
      }
    ],
    "appliedFilters": 1
  }
}
```

---

### **5. Advanced Search with Multiple Filters (POST)**

```bash
curl -X POST "http://localhost:3000/api/secure-select/places/search" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {
        "column": "city",
        "operator": "equals",
        "value": "New York"
      },
      {
        "column": "is_active",
        "operator": "is_true",
        "value": true
      },
      {
        "column": "capacity",
        "operator": "gte",
        "value": 50
      }
    ],
    "limit": 10,
    "page": 1,
    "include_count": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "place-123",
      "name": "Main Office",
      "city": "New York",
      "capacity": 100,
      "is_active": 1,
      "place_type": "office"
    }
  ],
  "meta": {
    "table": "places",
    "role": "admin",
    "totalRecords": 1,
    "totalCount": 1,
    "page": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false,
    "filters": [
      {
        "column": "city",
        "operator": "equals",
        "value": "New York"
      },
      {
        "column": "is_active",
        "operator": "is_true",
        "value": true
      },
      {
        "column": "capacity",
        "operator": "gte",
        "value": 50
      }
    ],
    "appliedFilters": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 1,
      "recordsPerPage": 10,
      "hasNextPage": false,
      "hasPreviousPage": false,
      "nextPage": null,
      "previousPage": null,
      "startRecord": 1,
      "endRecord": 1
    }
  }
}
```

---

### **6. Get Visitors with Text Search**

```bash
curl -X GET "http://localhost:3000/api/secure-select/visitors?filters=[{\"column\":\"first_name\",\"operator\":\"contains\",\"value\":\"John\"}]" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "visitor-123",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "company": "Tech Corp",
      "is_blacklisted": 0
    }
  ],
  "meta": {
    "table": "visitors",
    "role": "admin",
    "totalRecords": 1,
    "filters": [
      {
        "column": "first_name",
        "operator": "contains",
        "value": "John"
      }
    ],
    "appliedFilters": 1
  }
}
```

---

### **7. Get Today's Visits**

```bash
curl -X GET "http://localhost:3000/api/secure-select/todays_visits" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "visit-123",
      "visitor_id": "visitor-123",
      "first_name": "John",
      "last_name": "Doe",
      "company": "Tech Corp",
      "place_id": "place-123",
      "place_name": "Main Office",
      "visit_purpose": "Meeting",
      "host_name": "Jane Smith",
      "scheduled_start_time": "2023-12-29T10:00:00.000Z",
      "visit_status": "scheduled"
    }
  ],
  "meta": {
    "table": "todays_visits",
    "role": "admin",
    "totalRecords": 1,
    "filters": null,
    "appliedFilters": 0
  }
}
```

---

### **8. Global Search Across All Tables**

```bash
curl -X POST "http://localhost:3000/api/secure-select/search" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "John",
    "searchColumns": ["first_name", "last_name", "name"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "searchTerm": "John",
    "totalResults": 2,
    "resultsByTable": [
      {
        "table": "visitors",
        "results": [
          {
            "id": "visitor-123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@company.com"
          }
        ],
        "count": 1
      },
      {
        "table": "places",
        "results": [
          {
            "id": "place-456",
            "name": "John's Office",
            "city": "Boston"
          }
        ],
        "count": 1
      }
    ],
    "searchedTables": ["visitors", "places", "visits"],
    "tablesWithResults": 2
  },
  "meta": {
    "role": "admin",
    "searchColumns": ["first_name", "last_name", "name"],
    "timestamp": "2023-12-29T17:55:52.022Z"
  }
}
```

---

### **9. Get Filter Capabilities**

```bash
curl -X GET "http://localhost:3000/api/secure-select/capabilities" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "admin",
    "capabilities": {
      "textSearch": {
        "available": true,
        "operators": ["like", "ilike", "contains", "starts_with", "ends_with", "equals", "not_equals"]
      },
      "numericRange": {
        "available": true,
        "operators": ["gt", "gte", "lt", "lte", "between", "not_between", "equals", "not_equals"]
      },
      "dateRange": {
        "available": true,
        "operators": ["date_equals", "date_between", "date_after", "date_before"]
      },
      "booleanFilter": {
        "available": true,
        "operators": ["is_true", "is_false", "equals"]
      },
      "arrayFilter": {
        "available": true,
        "operators": ["in", "not_in"]
      },
      "nullCheck": {
        "available": true,
        "operators": ["is_null", "is_not_null"]
      }
    }
  }
}
```

---

## 🚨 **Error Examples**

### **1. Missing JWT Token**

```bash
curl -X GET "http://localhost:3000/api/secure-select/places"
```

**Response:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

### **2. Invalid JWT Token**

```bash
curl -X GET "http://localhost:3000/api/secure-select/places" \
  -H "Authorization: Bearer invalid_token"
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### **3. Insufficient Permissions**

```bash
# Using employee role token to access admin-only data
curl -X GET "http://localhost:3000/api/secure-select/users" \
  -H "Authorization: Bearer employee_jwt_token"
```

**Response:**
```json
{
  "success": false,
  "message": "Access denied. Table 'users' not accessible for role 'employee'",
  "allowedTables": ["places", "visitors", "visits"]
}
```

---

## 🎯 **Role-Based Access Examples**

### **Admin Role (Full Access):**
```bash
# Can access all tables
curl -X GET "http://localhost:3000/api/secure-select/places" \
  -H "Authorization: Bearer admin_jwt_token"

curl -X GET "http://localhost:3000/api/secure-select/users" \
  -H "Authorization: Bearer admin_jwt_token"
```

### **Employee Role (Limited Access):**
```bash
# Can access place management tables
curl -X GET "http://localhost:3000/api/secure-select/places" \
  -H "Authorization: Bearer employee_jwt_token"

# Cannot access user management
curl -X GET "http://localhost:3000/api/secure-select/users" \
  -H "Authorization: Bearer employee_jwt_token"
# Returns: Access denied
```

### **Reception Role (Basic Access):**
```bash
# Can access visitor and visit data
curl -X GET "http://localhost:3000/api/secure-select/visitors" \
  -H "Authorization: Bearer reception_jwt_token"

curl -X GET "http://localhost:3000/api/secure-select/todays_visits" \
  -H "Authorization: Bearer reception_jwt_token"
```

---

## 🔧 **JavaScript/Frontend Examples**

### **Using Fetch API:**

```javascript
// 1. Login to get JWT token
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'niroshmax01@gmail.com',
    password: '12345pass'
  })
});

const loginData = await loginResponse.json();
const jwtToken = loginData.token;

// 2. Use JWT token in API requests
const placesResponse = await fetch('http://localhost:3000/api/secure-select/places', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const placesData = await placesResponse.json();
console.log('Places:', placesData.data);

// 3. Advanced search with filters
const searchResponse = await fetch('http://localhost:3000/api/secure-select/places/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filters: [
      {
        column: 'city',
        operator: 'equals',
        value: 'New York'
      },
      {
        column: 'is_active',
        operator: 'is_true',
        value: true
      }
    ],
    limit: 10,
    page: 1
  })
});

const searchData = await searchResponse.json();
console.log('Search Results:', searchData.data);
```

### **Using Axios:**

```javascript
import axios from 'axios';

// Set up axios with JWT token
const api = axios.create({
  baseURL: 'http://localhost:3000/api/secure-select',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

// Get places
const places = await api.get('/places');

// Advanced search
const searchResults = await api.post('/places/search', {
  filters: [
    {
      column: 'city',
      operator: 'equals',
      value: 'New York'
    }
  ]
});

// Global search
const globalResults = await api.post('/search', {
  searchTerm: 'John',
  searchColumns: ['first_name', 'last_name']
});
```

---

## 📝 **Complete Test Script**

```bash
#!/bin/bash

# Set your JWT token here
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

echo "🔐 Testing Secure SELECT API with JWT Token"
echo "=============================================="

echo "1. Getting allowed tables..."
curl -s -X GET "http://localhost:3000/api/secure-select/tables" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n2. Getting places data..."
curl -s -X GET "http://localhost:3000/api/secure-select/places?limit=3" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n3. Searching visitors by name..."
curl -s -X GET "http://localhost:3000/api/secure-select/visitors?filters=[{\"column\":\"first_name\",\"operator\":\"contains\",\"value\":\"John\"}]" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n4. Getting today's visits..."
curl -s -X GET "http://localhost:3000/api/secure-select/todays_visits" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n5. Getting filter capabilities..."
curl -s -X GET "http://localhost:3000/api/secure-select/capabilities" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

echo -e "\n✅ All tests completed!"
```

---

## 🎉 **Summary**

### **Key Points:**
1. **Always include JWT token** in Authorization header
2. **Format:** `Authorization: Bearer YOUR_JWT_TOKEN`
3. **Get token by logging in** to `/api/auth/login`
4. **Role determines access** to tables and columns
5. **Use filters** for advanced querying
6. **Handle errors** for expired/invalid tokens

### **Available Endpoints:**
- `GET /api/secure-select/tables` - Get allowed tables
- `GET /api/secure-select/:table/info` - Get table schema
- `GET /api/secure-select/:table` - Get table data
- `POST /api/secure-select/:table/search` - Advanced search
- `POST /api/secure-select/search` - Global search
- `GET /api/secure-select/capabilities` - Get filter capabilities

**Your Secure SELECT API is ready to use with JWT authentication!** 🚀
