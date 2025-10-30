# Secure INSERT & UPDATE API Guide

## 🎯 Overview

The Secure INSERT and UPDATE APIs provide role-based, JWT-authenticated data manipulation capabilities with comprehensive security controls.

## 🔐 Authentication

**All endpoints require JWT authentication via Authorization header:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 INSERT API

### Single Record Insert

**Endpoint:** `POST /api/secure-insert/:tableName`

**Headers Required:**
- `Authorization: Bearer JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "column1": "value1",
  "column2": "value2",
  "column3": "value3"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/secure-insert/places \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Office",
    "description": "A new office location",
    "address": "123 Main St",
    "city": "New York",
    "place_type": "office",
    "capacity": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Record inserted successfully into places",
  "data": {
    "id": 15,
    "record": {
      "id": 15,
      "name": "New Office",
      "description": "A new office location",
      "address": "123 Main St",
      "city": "New York",
      "place_type": "office",
      "capacity": 100,
      "created_at": "2025-09-30T10:30:00",
      "updated_at": "2025-09-30T10:30:00",
      "created_by": 11,
      "updated_by": 11
    },
    "insertedColumns": ["name", "description", "address", "city", "place_type", "capacity", "created_at", "updated_at", "created_by", "updated_by"],
    "filteredColumns": "all"
  },
  "meta": {
    "table": "places",
    "role": "admin",
    "operation": "insert",
    "timestamp": "2025-09-30T10:30:00"
  }
}
```

### Bulk Insert

**Endpoint:** `POST /api/secure-insert/:tableName/bulk`

**Request Body:**
```json
{
  "data": [
    {
      "name": "Office 1",
      "description": "First office",
      "place_type": "office"
    },
    {
      "name": "Office 2", 
      "description": "Second office",
      "place_type": "office"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/secure-insert/places/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "name": "Office A",
        "description": "Office A description",
        "place_type": "office",
        "capacity": 50
      },
      {
        "name": "Office B",
        "description": "Office B description", 
        "place_type": "office",
        "capacity": 75
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk insert completed successfully - 2 records inserted into places",
  "data": {
    "insertedCount": 2,
    "firstInsertId": 16,
    "lastInsertId": 17,
    "columns": ["name", "description", "place_type", "capacity", "created_at", "updated_at", "created_by", "updated_by"]
  },
  "meta": {
    "table": "places",
    "role": "admin",
    "operation": "bulk_insert",
    "timestamp": "2025-09-30T10:30:00"
  }
}
```

---

## 🔄 UPDATE API

### Single Record Update

**Endpoint:** `PUT /api/secure-update/:tableName`

**Request Body:**
```json
{
  "where": {
    "id": 15
  },
  "data": {
    "name": "Updated Office Name",
    "capacity": 150,
    "description": "Updated description"
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/secure-update/places \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "id": 15
    },
    "data": {
      "name": "Updated Office Name",
      "capacity": 150,
      "description": "This office has been updated"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Update completed successfully - 1 record(s) updated in places",
  "data": {
    "affectedRows": 1,
    "updatedRecord": {
      "id": 15,
      "name": "Updated Office Name",
      "description": "This office has been updated",
      "address": "123 Main St",
      "city": "New York",
      "place_type": "office",
      "capacity": 150,
      "created_at": "2025-09-30T10:30:00",
      "updated_at": "2025-09-30T10:35:00",
      "created_by": 11,
      "updated_by": 11
    },
    "updatedColumns": ["name", "capacity", "description", "updated_at", "updated_by"],
    "whereConditions": {
      "id": 15
    }
  },
  "meta": {
    "table": "places",
    "role": "admin",
    "operation": "update",
    "timestamp": "2025-09-30T10:35:00"
  }
}
```

### Multiple Records Update

**Example with multiple WHERE conditions:**
```bash
curl -X PUT http://localhost:3000/api/secure-update/places \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "place_type": "office",
      "city": "New York"
    },
    "data": {
      "capacity": 200
    }
  }'
```

### Bulk Update

**Endpoint:** `PUT /api/secure-update/:tableName/bulk`

**Request Body:**
```json
{
  "updates": [
    {
      "where": {"id": 15},
      "data": {"name": "Updated Office 1", "capacity": 100}
    },
    {
      "where": {"id": 16}, 
      "data": {"name": "Updated Office 2", "capacity": 120}
    }
  ]
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/secure-update/places/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "where": {"id": 15},
        "data": {"name": "Office Alpha", "capacity": 100}
      },
      {
        "where": {"id": 16},
        "data": {"name": "Office Beta", "capacity": 120}
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk update completed - 2 total record(s) updated in places",
  "data": {
    "totalAffectedRows": 2,
    "processedUpdates": 2,
    "results": [
      {
        "index": 1,
        "affectedRows": 1,
        "success": true
      },
      {
        "index": 2,
        "affectedRows": 1,
        "success": true
      }
    ]
  },
  "meta": {
    "table": "places",
    "role": "admin",
    "operation": "bulk_update",
    "timestamp": "2025-09-30T10:40:00"
  }
}
```

---

## 🛡️ Security Features

### 1. Role-Based Access Control
- **Admin**: Full CRUD access to all tables
- **Manager**: Limited CRUD access
- **Employee**: Read-only access to place management tables
- **Reception**: Read-only access to place management tables

### 2. Column-Level Security
- Users can only insert/update columns they have permission for
- System automatically filters out restricted columns
- Audit fields (created_at, updated_at, created_by, updated_by) are automatically added

### 3. Table Access Control
- Users can only access tables they have permission for
- Operation-level permissions (create, read, update, delete)

### 4. Data Validation
- WHERE conditions are required for UPDATE operations
- Invalid columns are rejected
- System columns (id, created_at, created_by) are protected from direct updates

---

## 📊 Place Management Tables

### Tables with INSERT Access (Admin ONLY):
- `places` - Main places data ✅
- `place_deactivation_reasons` - Place deactivation reasons ✅
- `place_configuration` - Place configuration settings ✅ (when table exists)

### Tables with NO INSERT Access (All Roles):
- `users` - User accounts (READ/UPDATE/DELETE only)
- `profiles` - User profiles (READ/UPDATE/DELETE only)
- `visitors` - Visitor information (READ/UPDATE/DELETE only)
- `visits` - Visit records (READ/UPDATE/DELETE only)
- `visit_cancellations` - Cancelled visits (READ/UPDATE/DELETE only)
- `place_access_logs` - Access logs (READ/UPDATE/DELETE only)
- `place_notifications` - Notifications (READ/UPDATE/DELETE only)
- `place_statistics` - Statistics (READ/UPDATE/DELETE only)
- `products`, `orders`, `categories`, `inventory`, `transactions` - All other tables

### Tables with READ-only Access (Employee/Reception):
- `active_places` - Active places view
- `todays_visits` - Today's visits view

---

## 💻 JavaScript/Frontend Examples

### Using Fetch API

```javascript
// INSERT Example
async function insertPlace(placeData) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('http://localhost:3000/api/secure-insert/places', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(placeData)
  });
  
  const result = await response.json();
  return result;
}

// UPDATE Example
async function updatePlace(id, updateData) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('http://localhost:3000/api/secure-update/places', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      where: { id: id },
      data: updateData
    })
  });
  
  const result = await response.json();
  return result;
}

// Usage Examples
async function addNewPlace() {
  const newPlace = {
    name: "Conference Room A",
    description: "Large conference room for meetings",
    address: "456 Business Ave",
    city: "New York",
    place_type: "conference",
    capacity: 20
  };
  
  const result = await insertPlace(newPlace);
  if (result.success) {
    console.log('Place created:', result.data.record);
  }
}

async function updatePlaceCapacity() {
  const result = await updatePlace(15, { capacity: 200 });
  if (result.success) {
    console.log('Updated:', result.data.updatedRecord);
  }
}
```

### Using Axios

```javascript
import axios from 'axios';

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

// INSERT
async function insertData(table, data) {
  const response = await api.post(`/secure-insert/${table}`, data);
  return response.data;
}

// UPDATE
async function updateData(table, where, data) {
  const response = await api.put(`/secure-update/${table}`, {
    where,
    data
  });
  return response.data;
}

// Usage
async function managePlaces() {
  try {
    // Insert new place
    const newPlace = await insertData('places', {
      name: 'Meeting Room 1',
      place_type: 'meeting',
      capacity: 10
    });
    
    // Update place
    const updatedPlace = await updateData('places', 
      { id: newPlace.data.id }, 
      { capacity: 15 }
    );
    
    console.log('Operations completed successfully');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

## 🚨 Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Access denied - You don't have permission to INSERT into table: places"
}
```

```json
{
  "success": false,
  "message": "Access denied - Invalid columns for your role: password, secret_key"
}
```

```json
{
  "success": false,
  "message": "WHERE conditions are required for UPDATE operations"
}
```

```json
{
  "success": false,
  "message": "No records found matching the WHERE conditions"
}
```

### Error Handling in JavaScript

```javascript
async function handleInsertUpdate(table, data, operation = 'insert') {
  try {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const url = operation === 'insert' 
      ? `http://localhost:3000/api/secure-insert/${table}`
      : `http://localhost:3000/api/secure-update/${table}`;
      
    const method = operation === 'insert' ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      if (result.message.includes('Access denied')) {
        console.error('Permission denied:', result.message);
        return { success: false, error: 'PERMISSION_DENIED' };
      }
      if (result.message.includes('Invalid columns')) {
        console.error('Invalid columns:', result.message);
        return { success: false, error: 'INVALID_COLUMNS' };
      }
      throw new Error(result.message);
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}
```

---

## ✅ Success Checklist

- [ ] **Authentication**: Include `Authorization: Bearer JWT_TOKEN` header
- [ ] **Permissions**: Ensure user role has INSERT/UPDATE permissions for the table
- [ ] **Columns**: Only include columns the user role has access to
- [ ] **WHERE Conditions**: Always include WHERE conditions for UPDATE operations
- [ ] **Data Validation**: Validate data before sending to API
- [ ] **Error Handling**: Implement proper error handling for permission denials
- [ ] **Audit Fields**: System automatically adds created_at, updated_at, created_by, updated_by

---

## 🎯 Quick Reference

### INSERT Endpoints
- `POST /api/secure-insert/:tableName` - Single record
- `POST /api/secure-insert/:tableName/bulk` - Multiple records

### UPDATE Endpoints  
- `PUT /api/secure-update/:tableName` - Single/multiple records
- `PUT /api/secure-update/:tableName/bulk` - Bulk updates

### Required Headers 
- `Authorization: Bearer JWT_TOKEN`
- `Content-Type: application/json`

### Role Permissions

| Role | INSERT | UPDATE | Tables |
|------|--------|--------|---------|
| **Admin** | ✅ 3 tables only | ✅ All tables | Full CRUD |
| **Manager** | ❌ | ✅ Limited | Limited CRUD |
| **Employee** | ❌ | ❌ | Read-only place tables |
| **Reception** | ❌ | ❌ | Read-only place tables |

**INSERT Tables (Admin Only):**
- `places` - Main places data
- `place_deactivation_reasons` - Place deactivation reasons  
- `place_configuration` - Place configuration settings (when table exists)

---

**🎉 You're now ready to use the Secure INSERT & UPDATE APIs!**
