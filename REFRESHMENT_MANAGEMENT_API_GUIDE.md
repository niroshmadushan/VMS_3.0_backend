# 🍽️ Refreshment Management API Guide

Complete guide for managing refreshment types and items using the Secure API endpoints.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Authentication](#authentication)
4. [Refreshment Types Operations](#refreshment-types-operations)
5. [Refreshment Items Operations](#refreshment-items-operations)
6. [Frontend Examples](#frontend-examples)
7. [Error Handling](#error-handling)

---

## 📖 Overview

The Refreshment Management System uses two main tables:
- **`refreshment_types`** - Categories of refreshments (Beverages, Light Snacks, Full Meal, Custom)
- **`refreshment_items`** - Individual items within each type (Coffee, Tea, Sandwiches, etc.)

**Access Level:** Admin only (full CRUD access)

---

## 🔗 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Secure API Endpoints
- **INSERT:** `POST /api/secure-insert/{tableName}`
- **SELECT:** `GET /api/secure-select/{tableName}`
- **UPDATE:** `PUT /api/secure-update/{tableName}/{id}`
- **DELETE:** `DELETE /api/secure-update/{tableName}/{id}` (soft delete via update)

---

## 🔐 Authentication

All API requests require JWT authentication token in the header:

```javascript
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

---

## 🏷️ Refreshment Types Operations

### 1. Get All Refreshment Types

**Endpoint:** `GET /api/secure-select/refreshment_types`

**Request:**
```javascript
const response = await fetch('http://localhost:3000/api/secure-select/refreshment_types', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "type_1",
            "name": "Beverages",
            "code": "beverages",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        },
        {
            "id": "type_2",
            "name": "Light Snacks",
            "code": "light_snacks",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        }
    ],
    "meta": {
        "total": 2,
        "table": "refreshment_types"
    }
}
```

### 2. Get Active Refreshment Types Only

**Request with Filter:**
```javascript
const response = await fetch('http://localhost:3000/api/secure-select/refreshment_types?filters=' + 
    encodeURIComponent(JSON.stringify({
        is_active: { operator: '=', value: 1 },
        is_deleted: { operator: '=', value: 0 }
    })), {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

### 3. Create New Refreshment Type

**Endpoint:** `POST /api/secure-insert/refreshment_types`

**Request:**
```javascript
const newType = {
    id: 'type_5', // Unique ID (use UUID or custom ID)
    name: 'Desserts',
    code: 'desserts', // Unique code (lowercase, underscores)
    is_active: 1,
    is_deleted: 0
};

const response = await fetch('http://localhost:3000/api/secure-insert/refreshment_types', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(newType)
});

const data = await response.json();
```

**Response:**
```json
{
    "success": true,
    "message": "Record inserted successfully into refreshment_types",
    "data": {
        "id": "type_5",
        "record": {
            "id": "type_5",
            "name": "Desserts",
            "code": "desserts",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        },
        "insertedColumns": ["id", "name", "code", "is_active", "is_deleted"]
    }
}
```

### 4. Update Refreshment Type

**Endpoint:** `PUT /api/secure-update/refreshment_types/{id}`

**Request:**
```javascript
const updateData = {
    name: 'Beverages & Drinks', // Updated name
    is_active: 0 // Deactivate
};

const response = await fetch('http://localhost:3000/api/secure-update/refreshment_types/type_1', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
});

const data = await response.json();
```

**Response:**
```json
{
    "success": true,
    "message": "Record updated successfully in refreshment_types",
    "data": {
        "id": "type_1",
        "updatedFields": ["name", "is_active"],
        "record": {
            "id": "type_1",
            "name": "Beverages & Drinks",
            "code": "beverages",
            "is_active": 0,
            "is_deleted": 0,
            "updated_at": "2025-01-01T11:00:00.000Z"
        }
    }
}
```

### 5. Delete Refreshment Type (Soft Delete)

**Endpoint:** `PUT /api/secure-update/refreshment_types/{id}`

**Request:**
```javascript
const deleteData = {
    is_deleted: 1 // Soft delete flag
};

const response = await fetch('http://localhost:3000/api/secure-update/refreshment_types/type_1', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(deleteData)
});
```

**Note:** This is a soft delete. The record remains in the database but is marked as deleted.

---

## 🍽️ Refreshment Items Operations

### 1. Get All Refreshment Items

**Endpoint:** `GET /api/secure-select/refreshment_items`

**Request:**
```javascript
const response = await fetch('http://localhost:3000/api/secure-select/refreshment_items', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "item_1",
            "type_id": "type_1",
            "name": "Coffee",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        },
        {
            "id": "item_2",
            "type_id": "type_1",
            "name": "Tea",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        }
    ]
}
```

### 2. Get Items by Type

**Request with Filter:**
```javascript
const typeId = 'type_1'; // Beverages

const response = await fetch('http://localhost:3000/api/secure-select/refreshment_items?filters=' + 
    encodeURIComponent(JSON.stringify({
        type_id: { operator: '=', value: typeId },
        is_deleted: { operator: '=', value: 0 }
    })), {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

### 3. Get Items with Type Information (Join Query)

**Request:**
```javascript
// Get items with their type names
const response = await fetch('http://localhost:3000/api/secure-select/refreshment_items?join=' + 
    encodeURIComponent(JSON.stringify({
        table: 'refreshment_types',
        on: 'refreshment_items.type_id = refreshment_types.id',
        select: ['refreshment_items.*', 'refreshment_types.name as type_name', 'refreshment_types.code as type_code']
    })) + '&filters=' + encodeURIComponent(JSON.stringify({
        'refreshment_items.is_deleted': { operator: '=', value: 0 }
    })), {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

### 4. Create New Refreshment Item

**Endpoint:** `POST /api/secure-insert/refreshment_items`

**Request:**
```javascript
const newItem = {
    id: 'item_15', // Unique ID
    type_id: 'type_1', // Must reference existing refreshment_types.id
    name: 'Hot Chocolate',
    is_active: 1,
    is_deleted: 0
};

const response = await fetch('http://localhost:3000/api/secure-insert/refreshment_items', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(newItem)
});

const data = await response.json();
```

**Response:**
```json
{
    "success": true,
    "message": "Record inserted successfully into refreshment_items",
    "data": {
        "id": "item_15",
        "record": {
            "id": "item_15",
            "type_id": "type_1",
            "name": "Hot Chocolate",
            "is_active": 1,
            "is_deleted": 0,
            "created_at": "2025-01-01T10:00:00.000Z",
            "updated_at": "2025-01-01T10:00:00.000Z"
        }
    }
}
```

### 5. Update Refreshment Item

**Endpoint:** `PUT /api/secure-update/refreshment_items/{id}`

**Request:**
```javascript
const updateData = {
    name: 'Espresso Coffee', // Updated name
    type_id: 'type_1', // Can change type
    is_active: 0 // Deactivate
};

const response = await fetch('http://localhost:3000/api/secure-update/refreshment_items/item_1', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
});
```

### 6. Delete Refreshment Item (Soft Delete)

**Endpoint:** `PUT /api/secure-update/refreshment_items/{id}`

**Request:**
```javascript
const deleteData = {
    is_deleted: 1
};

const response = await fetch('http://localhost:3000/api/secure-update/refreshment_items/item_1', {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(deleteData)
});
```

---

## 💻 Frontend Examples

### Complete JavaScript Class for Refreshment Management

```javascript
class RefreshmentAPI {
    constructor(baseURL, token) {
        this.baseURL = baseURL || 'http://localhost:3000/api';
        this.token = token || localStorage.getItem('authToken');
    }

    // ========== REFRESHMENT TYPES ==========

    // Get all types
    async getTypes(activeOnly = false) {
        let url = `${this.baseURL}/secure-select/refreshment_types`;
        
        if (activeOnly) {
            const filters = JSON.stringify({
                is_active: { operator: '=', value: 1 },
                is_deleted: { operator: '=', value: 0 }
            });
            url += `?filters=${encodeURIComponent(filters)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    }

    // Get single type by ID
    async getTypeById(typeId) {
        const filters = JSON.stringify({
            id: { operator: '=', value: typeId },
            is_deleted: { operator: '=', value: 0 }
        });

        const response = await fetch(
            `${this.baseURL}/secure-select/refreshment_types?filters=${encodeURIComponent(filters)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();
        return data.success && data.data.length > 0 ? data.data[0] : null;
    }

    // Create type
    async createType(typeData) {
        const response = await fetch(`${this.baseURL}/secure-insert/refreshment_types`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(typeData)
        });

        return await response.json();
    }

    // Update type
    async updateType(typeId, updateData) {
        const response = await fetch(`${this.baseURL}/secure-update/refreshment_types/${typeId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        return await response.json();
    }

    // Delete type (soft delete)
    async deleteType(typeId) {
        return await this.updateType(typeId, { is_deleted: 1 });
    }

    // ========== REFRESHMENT ITEMS ==========

    // Get all items
    async getItems(typeId = null, activeOnly = false) {
        let filters = {};
        
        if (typeId) {
            filters.type_id = { operator: '=', value: typeId };
        }
        
        if (activeOnly) {
            filters.is_active = { operator: '=', value: 1 };
        }
        
        filters.is_deleted = { operator: '=', value: 0 };

        const url = `${this.baseURL}/secure-select/refreshment_items?filters=${encodeURIComponent(JSON.stringify(filters))}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    }

    // Get items with type information
    async getItemsWithTypes(typeId = null) {
        let filters = { 'refreshment_items.is_deleted': { operator: '=', value: 0 } };
        
        if (typeId) {
            filters['refreshment_items.type_id'] = { operator: '=', value: typeId };
        }

        const join = JSON.stringify({
            table: 'refreshment_types',
            on: 'refreshment_items.type_id = refreshment_types.id',
            select: [
                'refreshment_items.*',
                'refreshment_types.name as type_name',
                'refreshment_types.code as type_code'
            ]
        });

        const url = `${this.baseURL}/secure-select/refreshment_items?join=${encodeURIComponent(join)}&filters=${encodeURIComponent(JSON.stringify(filters))}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    }

    // Create item
    async createItem(itemData) {
        const response = await fetch(`${this.baseURL}/secure-insert/refreshment_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });

        return await response.json();
    }

    // Update item
    async updateItem(itemId, updateData) {
        const response = await fetch(`${this.baseURL}/secure-update/refreshment_items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        return await response.json();
    }

    // Delete item (soft delete)
    async deleteItem(itemId) {
        return await this.updateItem(itemId, { is_deleted: 1 });
    }
}

// Usage Example
const refreshmentAPI = new RefreshmentAPI();

// Get all active types
const types = await refreshmentAPI.getTypes(true);
console.log('Active Types:', types.data);

// Get items for a specific type
const beverages = await refreshmentAPI.getItems('type_1', true);
console.log('Beverage Items:', beverages.data);

// Create new type
const newType = await refreshmentAPI.createType({
    id: 'type_5',
    name: 'Desserts',
    code: 'desserts',
    is_active: 1,
    is_deleted: 0
});

// Create new item
const newItem = await refreshmentAPI.createItem({
    id: 'item_15',
    type_id: 'type_1',
    name: 'Hot Chocolate',
    is_active: 1,
    is_deleted: 0
});
```

### HTML Example - Refreshment Management Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refreshment Management</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .btn {
            padding: 8px 16px;
            margin: 5px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn-danger {
            background: #dc3545;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background: #f8f9fa;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>🍽️ Refreshment Management</h1>

    <!-- Refreshment Types Section -->
    <div class="section">
        <h2>Refreshment Types</h2>
        <button class="btn" onclick="loadTypes()">Load Types</button>
        <button class="btn" onclick="showAddTypeForm()">Add New Type</button>
        
        <div id="typeForm" style="display: none; margin-top: 20px;">
            <h3>Add/Edit Type</h3>
            <div class="form-group">
                <label>ID:</label>
                <input type="text" id="typeId" placeholder="type_5">
            </div>
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="typeName" placeholder="Desserts">
            </div>
            <div class="form-group">
                <label>Code:</label>
                <input type="text" id="typeCode" placeholder="desserts">
            </div>
            <button class="btn" onclick="saveType()">Save Type</button>
            <button class="btn" onclick="cancelTypeForm()">Cancel</button>
        </div>

        <table id="typesTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="typesTableBody"></tbody>
        </table>
    </div>

    <!-- Refreshment Items Section -->
    <div class="section">
        <h2>Refreshment Items</h2>
        <button class="btn" onclick="loadItems()">Load Items</button>
        <button class="btn" onclick="showAddItemForm()">Add New Item</button>
        
        <div id="itemForm" style="display: none; margin-top: 20px;">
            <h3>Add/Edit Item</h3>
            <div class="form-group">
                <label>ID:</label>
                <input type="text" id="itemId" placeholder="item_15">
            </div>
            <div class="form-group">
                <label>Type:</label>
                <select id="itemTypeId"></select>
            </div>
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="itemName" placeholder="Hot Chocolate">
            </div>
            <button class="btn" onclick="saveItem()">Save Item</button>
            <button class="btn" onclick="cancelItemForm()">Cancel</button>
        </div>

        <table id="itemsTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="itemsTableBody"></tbody>
        </table>
    </div>

    <script>
        // Include the RefreshmentAPI class from above
        const api = new RefreshmentAPI();
        let editingTypeId = null;
        let editingItemId = null;

        // Load types
        async function loadTypes() {
            try {
                const result = await api.getTypes(true);
                if (result.success) {
                    displayTypes(result.data);
                }
            } catch (error) {
                console.error('Error loading types:', error);
                alert('Failed to load types');
            }
        }

        // Display types in table
        function displayTypes(types) {
            const tbody = document.getElementById('typesTableBody');
            tbody.innerHTML = types.map(type => `
                <tr>
                    <td>${type.id}</td>
                    <td>${type.name}</td>
                    <td>${type.code}</td>
                    <td>${type.is_active ? 'Yes' : 'No'}</td>
                    <td>
                        <button class="btn" onclick="editType('${type.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteType('${type.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }

        // Show add type form
        function showAddTypeForm() {
            editingTypeId = null;
            document.getElementById('typeId').value = '';
            document.getElementById('typeName').value = '';
            document.getElementById('typeCode').value = '';
            document.getElementById('typeForm').style.display = 'block';
        }

        // Save type
        async function saveType() {
            const typeData = {
                id: document.getElementById('typeId').value,
                name: document.getElementById('typeName').value,
                code: document.getElementById('typeCode').value,
                is_active: 1,
                is_deleted: 0
            };

            try {
                let result;
                if (editingTypeId) {
                    result = await api.updateType(editingTypeId, typeData);
                } else {
                    result = await api.createType(typeData);
                }

                if (result.success) {
                    alert('Type saved successfully!');
                    cancelTypeForm();
                    loadTypes();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error saving type:', error);
                alert('Failed to save type');
            }
        }

        // Edit type
        async function editType(typeId) {
            editingTypeId = typeId;
            const type = await api.getTypeById(typeId);
            if (type) {
                document.getElementById('typeId').value = type.id;
                document.getElementById('typeName').value = type.name;
                document.getElementById('typeCode').value = type.code;
                document.getElementById('typeForm').style.display = 'block';
            }
        }

        // Delete type
        async function deleteType(typeId) {
            if (confirm('Are you sure you want to delete this type?')) {
                try {
                    const result = await api.deleteType(typeId);
                    if (result.success) {
                        alert('Type deleted successfully!');
                        loadTypes();
                    }
                } catch (error) {
                    console.error('Error deleting type:', error);
                    alert('Failed to delete type');
                }
            }
        }

        // Cancel type form
        function cancelTypeForm() {
            document.getElementById('typeForm').style.display = 'none';
            editingTypeId = null;
        }

        // Load items
        async function loadItems() {
            try {
                const result = await api.getItemsWithTypes();
                if (result.success) {
                    displayItems(result.data);
                }
            } catch (error) {
                console.error('Error loading items:', error);
                alert('Failed to load items');
            }
        }

        // Display items in table
        function displayItems(items) {
            const tbody = document.getElementById('itemsTableBody');
            tbody.innerHTML = items.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.type_name || 'N/A'}</td>
                    <td>${item.name}</td>
                    <td>${item.is_active ? 'Yes' : 'No'}</td>
                    <td>
                        <button class="btn" onclick="editItem('${item.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteItem('${item.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        }

        // Show add item form
        async function showAddItemForm() {
            editingItemId = null;
            document.getElementById('itemId').value = '';
            document.getElementById('itemName').value = '';
            
            // Load types for dropdown
            const typesResult = await api.getTypes(true);
            const typeSelect = document.getElementById('itemTypeId');
            typeSelect.innerHTML = '<option value="">Select Type</option>';
            if (typesResult.success) {
                typesResult.data.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.name;
                    typeSelect.appendChild(option);
                });
            }
            
            document.getElementById('itemForm').style.display = 'block';
        }

        // Save item
        async function saveItem() {
            const itemData = {
                id: document.getElementById('itemId').value,
                type_id: document.getElementById('itemTypeId').value,
                name: document.getElementById('itemName').value,
                is_active: 1,
                is_deleted: 0
            };

            try {
                let result;
                if (editingItemId) {
                    result = await api.updateItem(editingItemId, itemData);
                } else {
                    result = await api.createItem(itemData);
                }

                if (result.success) {
                    alert('Item saved successfully!');
                    cancelItemForm();
                    loadItems();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Error saving item:', error);
                alert('Failed to save item');
            }
        }

        // Edit item
        async function editItem(itemId) {
            editingItemId = itemId;
            // Load item details and populate form
            // Implementation similar to editType
            alert('Edit item functionality - implement similar to editType');
        }

        // Delete item
        async function deleteItem(itemId) {
            if (confirm('Are you sure you want to delete this item?')) {
                try {
                    const result = await api.deleteItem(itemId);
                    if (result.success) {
                        alert('Item deleted successfully!');
                        loadItems();
                    }
                } catch (error) {
                    console.error('Error deleting item:', error);
                    alert('Failed to delete item');
                }
            }
        }

        // Cancel item form
        function cancelItemForm() {
            document.getElementById('itemForm').style.display = 'none';
            editingItemId = null;
        }

        // Load data on page load
        window.addEventListener('load', () => {
            loadTypes();
            loadItems();
        });
    </script>
</body>
</html>
```

---

## ⚠️ Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
    "success": false,
    "message": "Unauthorized - Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
    "success": false,
    "message": "Access denied - Invalid columns for your role"
}
```

**400 Bad Request:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [...]
}
```

### Error Handling Example

```javascript
async function safeAPICall(apiFunction) {
    try {
        const result = await apiFunction();
        
        if (!result.success) {
            console.error('API Error:', result.message);
            alert('Error: ' + result.message);
            return null;
        }
        
        return result.data;
    } catch (error) {
        console.error('Network Error:', error);
        alert('Network error. Please check your connection.');
        return null;
    }
}

// Usage
const types = await safeAPICall(() => api.getTypes());
```

---

## 📝 Notes

1. **ID Generation:** Use UUID or a consistent naming pattern (e.g., `type_1`, `item_1`)
2. **Soft Delete:** All deletes are soft deletes (sets `is_deleted = 1`)
3. **Foreign Key:** `refreshment_items.type_id` must reference an existing `refreshment_types.id`
4. **Unique Codes:** `refreshment_types.code` must be unique
5. **Admin Only:** These operations require admin role permissions

---

## 🔗 Related Documentation

- [Secure Insert API Guide](./SECURE_INSERT_UPDATE_API_GUIDE.md)
- [Secure Select API Guide](./SECURE_SELECT_API_DOCUMENTATION.md)
- [Secure Update API Guide](./SECURE_INSERT_UPDATE_API_GUIDE.md)

---

**Last Updated:** 2025-01-01

