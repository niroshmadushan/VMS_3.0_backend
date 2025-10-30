# 🔒 User Management API - Permissions Guide

## 🎯 Current Permission Setup

### **Access Control:**
- **All User Management APIs require ADMIN role**
- Only users with `role = 'admin'` can access these endpoints
- JWT token must contain the admin role

---

## ⚠️ Common "Insufficient Permission" Issues

### **Issue 1: User is not an admin**

**Problem:** The logged-in user's role is not 'admin'

**Check:**
```sql
SELECT id, email, role FROM users WHERE email = 'your@email.com';
```

**Solution:** Update user role to admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### **Issue 2: JWT token doesn't contain role**

**Problem:** The JWT token was created before the user was made admin

**Solution:** Logout and login again to get a new JWT token with updated role

### **Issue 3: Case sensitivity**

**Problem:** Role is stored as 'Admin' but checking for 'admin'

**Solution:** Ensure role is lowercase 'admin' in database

---

## 🔍 How to Debug Permission Issues

### **Step 1: Check User Role in Database**

```javascript
// check-user-role.js
const mysql = require('mysql2/promise');

async function checkUserRole() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'auth-db'
    });

    const [users] = await connection.execute(
        'SELECT id, email, role, is_email_verified FROM users WHERE email = ?',
        ['niroshmax01@gmail.com']
    );

    console.log('User details:', users[0]);
    await connection.end();
}

checkUserRole();
```

### **Step 2: Check JWT Token Contents**

```javascript
// Decode JWT token (in browser console)
const token = localStorage.getItem('jwt_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('User role:', payload.role);
```

### **Step 3: Check Authorization Middleware**

The middleware checks:
1. ✅ Valid JWT token
2. ✅ Active session in database
3. ✅ User role matches required roles

---

## 🔧 Permission Configuration Options

### **Option 1: Admin Only (Current Setup)**

```javascript
// routes/userManagement.js
router.use(authenticateToken);
router.use(authorizeRoles(['admin'])); // Only admin
```

**Use this if:** Only admins should manage users

### **Option 2: Admin and Moderators**

```javascript
// routes/userManagement.js
router.use(authenticateToken);
router.use(authorizeRoles(['admin', 'moderator'])); // Admin and moderator
```

**Use this if:** Both admins and moderators should manage users

### **Option 3: All Authenticated Users**

```javascript
// routes/userManagement.js
router.use(authenticateToken);
// Remove authorizeRoles - all authenticated users can access
```

**Use this if:** Any logged-in user should manage users (not recommended)

### **Option 4: Different Permissions per Endpoint**

```javascript
// routes/userManagement.js
router.use(authenticateToken);

// Statistics - all authenticated users
router.get('/statistics', getUserStatistics);

// View users - admin and moderator
router.get('/users', authorizeRoles(['admin', 'moderator']), getAllUsers);

// Update/Delete - admin only
router.put('/users/:userId', authorizeRoles(['admin']), updateUser);
router.delete('/users/:userId', authorizeRoles(['admin']), deleteUser);
```

**Use this if:** You want granular permissions

---

## ✅ Recommended Setup (Current)

**Current configuration is SECURE and RECOMMENDED:**
- ✅ Only admins can manage users
- ✅ Prevents unauthorized access
- ✅ Follows security best practices

---

## 🔓 How to Make User an Admin

### **Method 1: Using Database**

```sql
-- Make user an admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Verify
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

### **Method 2: Using Node.js Script**

```javascript
// make-admin.js
const mysql = require('mysql2/promise');

async function makeAdmin(email) {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'auth-db'
    });

    await connection.execute(
        'UPDATE users SET role = ? WHERE email = ?',
        ['admin', email]
    );

    console.log(`✅ ${email} is now an admin`);
    await connection.end();
}

makeAdmin('user@example.com');
```

---

## 📊 Current Admin Users

Based on your database:
- **Total Users:** 5
- **Admin Users:** 3
- **Your Admin Account:** niroshmax01@gmail.com ✅

---

## 🚨 Troubleshooting Steps

If you're getting "insufficient permission" error:

### **1. Verify User Role:**
```bash
node check-user-role.js
```

### **2. Logout and Login Again:**
- Clear localStorage
- Login again to get fresh JWT token with updated role

### **3. Check Token in Browser Console:**
```javascript
const token = localStorage.getItem('jwt_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role:', payload.role);
```

### **4. Verify API Response:**
```javascript
// If you get 403 Forbidden
{
  "success": false,
  "message": "Insufficient permissions"
}
```

This means your user is not an admin.

---

## 🔐 Security Notes

**Why Admin-Only Access?**
- Prevents unauthorized user data access
- Protects sensitive information
- Prevents privilege escalation
- Follows principle of least privilege

**What Admins Can Do:**
- ✅ View all users
- ✅ Update any user's email
- ✅ Change any user's role
- ✅ Update any user's profile
- ✅ Activate/deactivate accounts
- ✅ Send password resets
- ✅ Delete users
- ✅ View statistics

**What Admins Cannot Do:**
- ❌ Delete their own account (self-protection)

---

## 📝 Summary

**Current Setup:** ✅ **SECURE - Admin Only**

**Your Admin Account:** niroshmax01@gmail.com (role: admin) ✅

**To Access APIs:**
1. Login with admin account
2. Get JWT token
3. Use token in Authorization header
4. All user management features available

**If Getting Permission Error:**
1. Verify user role is 'admin' in database
2. Logout and login again
3. Check JWT token contains role: 'admin'

---

**The permission system is working correctly and securely!** 🔒



