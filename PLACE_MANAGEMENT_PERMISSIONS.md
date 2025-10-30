# 🏢 PLACE MANAGEMENT SYSTEM - PERMISSIONS CONFIGURATION

## 📋 **Overview**

Your authentication backend now includes comprehensive permissions for the **Place Management System** with role-based access control for all 9 tables and 2 views from the `place-managemnt.sql` file.

---

## 🎯 **Place Management Tables**

### **Core Tables:**
1. **`places`** - Main places/venues information
2. **`place_deactivation_reasons`** - Reasons for place deactivation
3. **`visitors`** - Visitor information and profiles
4. **`visits`** - Visit records and scheduling
5. **`visit_cancellations`** - Visit cancellation tracking
6. **`place_access_logs`** - Access control and logging
7. **`place_notifications`** - Place-related notifications
8. **`place_statistics`** - Analytics and statistics

### **Views:**
9. **`active_places`** - View of active places only
10. **`todays_visits`** - View of today's scheduled visits

---

## 🔐 **Role-Based Access Control**

### **Admin Role - Full Access:**
- ✅ **All Tables**: Full CREATE/READ/UPDATE/DELETE access
- ✅ **All Columns**: Complete access to all data
- ✅ **All Filters**: Advanced filtering capabilities
- ✅ **High Limits**: Up to 1000 records per query

### **Manager Role - Read-Only Access:**
- ✅ **All Tables**: READ access only
- ✅ **Limited Columns**: Sensitive data hidden
- ✅ **Most Filters**: Advanced filtering except array filters
- ✅ **Medium Limits**: Up to 500 records per query

### **Employee Role - Read-Only Access:**
- ✅ **All Tables**: READ access only
- ✅ **Basic Columns**: Essential information only
- ✅ **Basic Filters**: Text search, numeric range, date range
- ✅ **Standard Limits**: Up to 100 records per query

### **Reception Role - Read-Only Access:**
- ✅ **All Tables**: READ access only
- ✅ **Basic Columns**: Essential information only
- ✅ **Limited Filters**: Text search and date range only
- ✅ **Standard Limits**: Up to 100 records per query

### **User Role - No Access:**
- ❌ **Place Management Tables**: No access
- ✅ **Public Tables**: Basic access to places, products, categories

---

## 📊 **Detailed Permissions Matrix**

| **Table** | **Admin** | **Manager** | **Employee** | **Reception** | **User** |
|-----------|-----------|-------------|--------------|---------------|----------|
| **places** | CRUD | READ | READ | READ | READ* |
| **place_deactivation_reasons** | CRUD | READ | READ | READ | ❌ |
| **visitors** | CRUD | READ | READ | READ | ❌ |
| **visits** | CRUD | READ | READ | READ | ❌ |
| **visit_cancellations** | CRUD | READ | READ | READ | ❌ |
| **place_access_logs** | CRUD | READ | READ | READ | ❌ |
| **place_notifications** | CRUD | READ | READ | READ | ❌ |
| **place_statistics** | CRUD | READ | READ | READ | ❌ |
| **active_places** | READ | READ | READ | READ | ❌ |
| **todays_visits** | READ | READ | READ | READ | ❌ |

**Legend:** CRUD = Create/Read/Update/Delete, READ = Read only, ❌ = No access
*User role has limited access to places table (public data only)

---

## 🔍 **Column Access by Role**

### **Admin - All Columns:**
```sql
-- Complete access to all columns in all tables
places: [*] -- All columns
visitors: [*] -- All columns including sensitive data
visits: [*] -- All columns
place_access_logs: [*] -- All columns
-- ... and so on
```

### **Manager - Limited Sensitive Data:**
```sql
-- Limited access to sensitive columns
visitors: [id, first_name, last_name, email, phone, company, designation, created_at]
visits: [id, visitor_id, place_id, visit_purpose, host_name, scheduled_start_time, scheduled_end_time, visit_status, created_at]
place_deactivation_reasons: [id, place_id, reason_type, reason_description, deactivated_at, estimated_reactivation_date]
```

### **Employee - Basic Information:**
```sql
-- Basic information only
visitors: [id, first_name, last_name, email, phone, company, created_at]
visits: [id, visitor_id, place_id, visit_purpose, host_name, scheduled_start_time, visit_status]
place_access_logs: [id, visit_id, access_type, access_time]
```

### **Reception - Essential Data:**
```sql
-- Essential data for reception duties
visitors: [id, first_name, last_name, email, phone, company, created_at]
visits: [id, visitor_id, place_id, visit_purpose, host_name, scheduled_start_time, visit_status]
place_notifications: [id, place_id, title, message, priority]
```

---

## 🛠️ **API Usage Examples**

### **Admin - Full Access:**
```javascript
// Admin can perform all operations
GET /api/secure-select/visitors
POST /api/secure-select/visitors  // Create new visitor
PUT /api/secure-select/visitors/:id  // Update visitor
DELETE /api/secure-select/visitors/:id  // Delete visitor

// Advanced filtering
GET /api/secure-select/visits?filters=[{"column":"visit_status","operator":"equals","value":"scheduled"}]
```

### **Manager - Read Only:**
```javascript
// Manager can only read data
GET /api/secure-select/visitors
GET /api/secure-select/visits
GET /api/secure-select/place_access_logs

// Cannot create/update/delete
POST /api/secure-select/visitors  // ❌ 403 Forbidden
```

### **Employee - Read Only with Basic Filters:**
```javascript
// Employee can read with basic filtering
GET /api/secure-select/visitors?filters=[{"column":"first_name","operator":"contains","value":"John"}]
GET /api/secure-select/visits?filters=[{"column":"scheduled_start_time","operator":"date_after","value":"2023-01-01"}]

// Cannot use advanced filters
GET /api/secure-select/visitors?filters=[{"column":"id","operator":"in","value":[1,2,3]}]  // ❌ 403 Forbidden
```

### **Reception - Limited Access:**
```javascript
// Reception can access basic information
GET /api/secure-select/visitors
GET /api/secure-select/visits
GET /api/secure-select/todays_visits

// Can use text search and date filters
GET /api/secure-select/visitors?filters=[{"column":"first_name","operator":"contains","value":"Smith"}]
```

---

## 🔒 **Security Features**

### **Automatic Role Extraction:**
- Role extracted from JWT token (`req.user.role`)
- No frontend role data needed
- Automatic permission validation

### **Column-Level Security:**
- Sensitive columns hidden by role
- Personal information protected
- Access logs limited by role

### **Operation-Level Security:**
- CREATE/UPDATE/DELETE restricted to admin
- READ operations filtered by role
- View access controlled

---

## 📈 **Pagination Limits by Role**

| **Role** | **Max Records** | **Default Limit** | **Max Offset** |
|----------|----------------|-------------------|----------------|
| **Admin** | 1000 | 50 | 100,000 |
| **Manager** | 500 | 25 | 50,000 |
| **Employee** | 100 | 20 | 10,000 |
| **Reception** | 100 | 20 | 10,000 |
| **User** | 50 | 10 | 1,000 |

---

## 🎯 **Common Use Cases**

### **Reception Desk:**
```javascript
// Check today's visits
GET /api/secure-select/todays_visits

// Search visitors by name
GET /api/secure-select/visitors?filters=[{"column":"first_name","operator":"contains","value":"John"}]

// Check active places
GET /api/secure-select/active_places
```

### **Security Team:**
```javascript
// Check access logs
GET /api/secure-select/place_access_logs

// View place notifications
GET /api/secure-select/place_notifications

// Check visitor blacklist
GET /api/secure-select/visitors?filters=[{"column":"is_blacklisted","operator":"is_true","value":true}]
```

### **Management:**
```javascript
// View place statistics
GET /api/secure-select/place_statistics

// Check visit cancellations
GET /api/secure-select/visit_cancellations

// Monitor place deactivations
GET /api/secure-select/place_deactivation_reasons
```

---

## 🚀 **Ready to Use**

Your place management system is now fully integrated with:

✅ **Complete table access control** for all 10 tables/views  
✅ **Role-based permissions** (admin/manager/employee/reception/user)  
✅ **Column-level security** with sensitive data protection  
✅ **Advanced filtering** capabilities per role  
✅ **Pagination limits** appropriate for each role  
✅ **JWT token validation** with automatic role extraction  
✅ **SQL injection protection** with parameterized queries  

**The system is ready for immediate use with enterprise-level security!** 🎉

You can now securely access all place management data through your authentication backend with proper role-based access control.
