# 🔐 SECURE SELECT API DOCUMENTATION

## 📋 **Overview**

A secure, role-based SELECT API system similar to Supabase that provides:
- **Role-based table access control**
- **Column-level permissions**
- **Advanced filtering and pagination**
- **JWT token validation with automatic role extraction**
- **SQL injection protection**

---

## 🎯 **Key Features**

### ✅ **Security Features:**
- JWT token validation (role extracted from token, not frontend)
- Role-based table access control
- Column-level permissions
- SQL injection protection
- Query parameter validation

### ✅ **Supabase-like Features:**
- Flexible filtering (`WHERE` clauses)
- Pagination support
- Column selection
- Sorting capabilities
- Advanced search with multiple conditions

---

## 🔑 **Role-Based Access Control**

### **Admin Role:**
- ✅ **Full access** to all tables
- ✅ **All columns** visible
- ✅ **All operations** allowed

### **Employee Role:**
- ✅ **Limited table access** (business tables only)
- ✅ **Sensitive columns hidden** (passwords, tokens)
- ✅ **Read/write access** to business data

### **User Role:**
- ✅ **Public table access** only
- ✅ **Very limited columns** (public data only)
- ✅ **Read-only access**

---

## 🛠️ **API Endpoints**

### **1. Get Allowed Tables**
```http
GET /api/secure-select/tables
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "admin",
    "allowedTables": [
      "users", "profiles", "places", "products", "orders"
    ],
    "tableCount": 5
  }
}
```

### **2. Basic SELECT with Filtering**
```http
GET /api/secure-select/places?where=name LIKE '%restaurant%'&limit=10&page=1
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `select`: Comma-separated column names
- `where`: WHERE clause conditions
- `order`: ORDER BY clause
- `limit`: Number of records (max 1000)
- `offset`: Skip records
- `page`: Page number (for pagination)
- `include_count`: Include total count

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Restaurant ABC",
      "description": "Fine dining",
      "location": "New York"
    }
  ],
  "meta": {
    "table": "places",
    "role": "admin",
    "totalRecords": 1,
    "totalCount": 50,
    "page": 1,
    "limit": 10,
    "hasMore": true,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "recordsPerPage": 10
    }
  }
}
```

### **3. Get Table Information**
```http
GET /api/secure-select/places/info
Authorization: Bearer <jwt-token>
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
        "Type": "int(11)",
        "Null": "NO",
        "Key": "PRI"
      },
      {
        "Field": "name",
        "Type": "varchar(255)",
        "Null": "NO"
      }
    ],
    "allowedColumns": ["*"],
    "totalColumns": 5,
    "visibleColumnsCount": 5
  }
}
```

### **4. Advanced Search**
```http
POST /api/secure-select/places/search
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "searchParams": [
    {
      "column": "name",
      "operator": "LIKE",
      "value": "restaurant"
    },
    {
      "column": "price",
      "operator": "BETWEEN",
      "value": [10, 50]
    },
    {
      "column": "status",
      "operator": "=",
      "value": "active"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Restaurant ABC",
      "price": 25.99,
      "status": "active"
    }
  ],
  "meta": {
    "table": "places",
    "role": "admin",
    "searchConditions": [...],
    "totalResults": 1
  }
}
```

---

## 🔒 **Security Implementation**

### **JWT Token Validation:**
```javascript
// Automatic role extraction from JWT token
const userRole = req.user.role; // From authenticateToken middleware
const userId = req.user.id;
```

### **Table Access Control:**
```javascript
const tableAccessControl = {
    admin: ['users', 'profiles', 'places', 'products', 'orders'],
    employee: ['places', 'products', 'orders', 'categories'],
    user: ['places', 'products', 'categories']
};
```

### **Column Access Control:**
```javascript
const columnAccessControl = {
    admin: {
        users: ['*'], // All columns
        places: ['*']
    },
    employee: {
        users: ['id', 'email', 'role'], // Limited columns
        places: ['*']
    },
    user: {
        users: ['id', 'email'], // Very limited
        places: ['id', 'name', 'description']
    }
};
```

---

## 📊 **Usage Examples**

### **Frontend JavaScript Integration:**

```javascript
class SecureSelectAPI {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }

    async makeRequest(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${this.baseURL}/secure-select${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (response.status === 401) {
            throw new Error('Authentication required');
        }

        if (response.status === 403) {
            throw new Error('Access denied');
        }

        return await response.json();
    }

    // Get allowed tables for current user
    async getAllowedTables() {
        return await this.makeRequest('/tables');
    }

    // Basic select with filtering
    async select(tableName, options = {}) {
        const params = new URLSearchParams();
        
        if (options.select) params.append('select', options.select);
        if (options.where) params.append('where', options.where);
        if (options.order) params.append('order', options.order);
        if (options.limit) params.append('limit', options.limit);
        if (options.page) params.append('page', options.page);
        if (options.include_count) params.append('include_count', 'true');

        const queryString = params.toString();
        return await this.makeRequest(`/${tableName}${queryString ? '?' + queryString : ''}`);
    }

    // Get table info
    async getTableInfo(tableName) {
        return await this.makeRequest(`/${tableName}/info`);
    }

    // Advanced search
    async search(tableName, searchConditions) {
        return await this.makeRequest(`/${tableName}/search`, {
            method: 'POST',
            body: JSON.stringify({ searchParams: searchConditions })
        });
    }
}

// Usage Examples
const api = new SecureSelectAPI();

// Get allowed tables
const tables = await api.getAllowedTables();
console.log('Allowed tables:', tables.data.allowedTables);

// Select places with filtering
const places = await api.select('places', {
    where: "name LIKE '%restaurant%'",
    limit: 10,
    page: 1,
    include_count: true
});

// Advanced search
const searchResults = await api.search('places', [
    { column: 'name', operator: 'LIKE', value: 'restaurant' },
    { column: 'price', operator: 'BETWEEN', value: [10, 50] }
]);
```

### **React Hook Example:**

```javascript
import { useState, useEffect } from 'react';

export const useSecureSelect = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const api = new SecureSelectAPI();

    const select = async (tableName, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.select(tableName, options);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const search = async (tableName, conditions) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.search(tableName, conditions);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        select,
        search,
        loading,
        error
    };
};
```

---

## 🧪 **Testing Examples**

### **CURL Commands:**

```bash
# Get allowed tables
curl -X GET "http://localhost:3000/api/secure-select/tables" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Select places with filtering
curl -X GET "http://localhost:3000/api/secure-select/places?where=name LIKE '%restaurant%'&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get table info
curl -X GET "http://localhost:3000/api/secure-select/places/info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Advanced search
curl -X POST "http://localhost:3000/api/secure-select/places/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "searchParams": [
      {
        "column": "name",
        "operator": "LIKE",
        "value": "restaurant"
      }
    ]
  }'
```

---

## 🚨 **Error Handling**

### **Common Error Responses:**

#### **401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### **403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Table 'users' not accessible for role 'user'",
  "allowedTables": ["places", "products", "categories"]
}
```

#### **400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "error": "QUERY_VALIDATION_ERROR"
}
```

#### **500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Database query failed",
  "error": "MySQL connection error"
}
```

---

## 🔧 **Configuration**

### **Adding New Tables:**
```javascript
// In middleware/secureSelect.js
const tableAccessControl = {
    admin: [
        'users', 'profiles', 'places', 'products', 'orders',
        'new_table' // Add new table here
    ],
    employee: [
        'places', 'products', 'orders', 'categories',
        'new_table' // Add to appropriate roles
    ],
    user: [
        'places', 'products', 'categories'
        // Don't add if user shouldn't access
    ]
};
```

### **Adding New Roles:**
```javascript
const tableAccessControl = {
    admin: [...],
    employee: [...],
    user: [...],
    manager: [ // New role
        'places', 'products', 'orders', 'employees'
    ]
};
```

---

## 🎯 **Benefits**

### ✅ **Security:**
- Role-based access control
- Column-level permissions
- SQL injection protection
- JWT token validation
- No frontend role data needed

### ✅ **Flexibility:**
- Supabase-like API
- Advanced filtering
- Pagination support
- Dynamic queries
- Easy to extend

### ✅ **Performance:**
- Optimized queries
- Connection pooling
- Query result caching
- Efficient pagination

**Your secure SELECT API is now ready with enterprise-level security and Supabase-like functionality!** 🚀
