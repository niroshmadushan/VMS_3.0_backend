# 🔒 Login Attempt Lockout Guide

## 🎯 Overview

This guide explains the login attempt lockout system - how many attempts are allowed, when accounts get locked, and how long until they unlock.

---

## 📊 Login Attempt Lockout Rules

### **Maximum Failed Attempts:** `5 attempts`

After **5 failed login attempts**, the account is automatically locked.

### **Lockout Duration:** `30 minutes`

Once locked, the account remains locked for **30 minutes** (1,800,000 milliseconds).

### **Auto-Reset:** `Yes` ✅

The account automatically unlocks after 30 minutes. No manual action required.

---

## 🔢 How It Works

### Step-by-Step Process:

1. **Attempt 1-4:** User can try logging in (invalid credentials message)
2. **Attempt 5:** Account gets locked immediately
3. **Locked State:** Account cannot be used for **30 minutes**
4. **After 30 Minutes:** Account automatically unlocks, login attempts reset to 0

---

## 📝 Code Implementation

**File:** `controllers/authController.js`

```javascript
// Line 259-260
const newAttempts = user.login_attempts + 1;
const lockUntil = newAttempts >= 5 
    ? new Date(Date.now() + 30 * 60 * 1000)  // Lock for 30 minutes
    : null;
```

**Lockout Check:**
```javascript
// Line 248-252
if (user.locked_until && new Date() < new Date(user.locked_until)) {
    return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed attempts'
    });
}
```

**Reset on Successful Login:**
```javascript
// Line 313
await executeQuery(
    'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
    [user.id]
);
```

---

## ⏰ Lockout Timeline

| Attempt | Status | Lockout Time |
|---------|--------|--------------|
| **1st attempt** | ❌ Failed | No lockout |
| **2nd attempt** | ❌ Failed | No lockout |
| **3rd attempt** | ❌ Failed | No lockout |
| **4th attempt** | ❌ Failed | No lockout |
| **5th attempt** | ❌ Failed | 🔒 **LOCKED for 30 minutes** |
| **After 30 min** | ✅ Auto-unlocked | Ready to try again |

---

## 🚨 Lockout Response

When an account is locked, the API returns:

**HTTP Status:** `423 Locked`

**Response:**
```json
{
  "success": false,
  "message": "Account is temporarily locked due to too many failed attempts"
}
```

---

## ⏱️ How Long Until Reset?

### **Automatic Reset:**
- ⏰ **Lockout Duration:** `30 minutes`
- 🔄 **Auto-Reset:** Account unlocks automatically after 30 minutes
- 📅 **Reset Time:** Current time + 30 minutes = `locked_until` timestamp

### **Example:**
- **Locked at:** 2:00 PM
- **Unlocks at:** 2:30 PM (30 minutes later)
- **After 2:30 PM:** User can try logging in again

---

## 🔍 Check Lockout Status

### **Database Query:**
```sql
SELECT 
    id,
    email,
    login_attempts,
    locked_until,
    TIMESTAMPDIFF(MINUTE, NOW(), locked_until) as minutes_remaining
FROM users 
WHERE email = 'user@example.com';
```

### **Response Example:**
```
email: user@example.com
login_attempts: 5
locked_until: 2024-10-22 14:30:00
minutes_remaining: 15 (if current time is 14:15:00)
```

---

## 🔓 Manual Unlock (Admin Only)

Admins can manually unlock accounts using the admin API.

### **Endpoint:** `PUT /api/admin/users/:userId/lock`

**Request:**
```json
{
  "locked": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User account unlocked successfully"
}
```

**Code:**
```javascript
// controllers/adminController.js - Line 271-305
const toggleUserLock = async (req, res) => {
    const { userId } = req.params;
    const { locked } = req.body;
    
    const lockUntil = locked 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours
        : null;
    const loginAttempts = locked ? 5 : 0;
    
    // Update user lock status
}
```

---

## 📊 System Settings

**Database Table:** `system_settings`

**Default Values:**
```sql
('max_login_attempts', '5', 'Maximum login attempts before account lockout'),
('lockout_duration', '30', 'Account lockout duration in minutes')
```

**Change Lockout Duration:**
```sql
UPDATE system_settings 
SET setting_value = '60'  -- Change to 60 minutes
WHERE setting_key = 'lockout_duration';
```

**Change Maximum Attempts:**
```sql
UPDATE system_settings 
SET setting_value = '10'  -- Change to 10 attempts
WHERE setting_key = 'max_login_attempts';
```

**⚠️ Note:** The code currently uses hardcoded values. To use system settings, you'll need to modify the controller to read from `system_settings` table.

---

## 🔄 Reset Login Attempts

### **Automatic Reset:**
- ✅ **On Successful Login:** Login attempts reset to 0, `locked_until` set to NULL
- ✅ **After Lockout Period:** Account unlocks automatically, but attempts remain at 5 until successful login

### **Manual Reset (Admin):**
```sql
UPDATE users 
SET login_attempts = 0, 
    locked_until = NULL 
WHERE id = ?;
```

---

## 🛡️ Security Features

### ✅ **What's Protected:**
- Account lockout after 5 failed attempts
- 30-minute cooldown period
- Automatic unlock after timeout
- Login attempts tracking in database
- IP address and user agent logging

### ✅ **What Happens:**
- Failed attempts are logged in `login_attempts` table
- User account's `login_attempts` counter increments
- `locked_until` timestamp is set when account locks
- Successful login resets counters

---

## 📋 Summary Table

| Setting | Value | Description |
|--------|-------|-------------|
| **Max Attempts** | `5` | Maximum failed login attempts before lockout |
| **Lockout Duration** | `30 minutes` | How long account stays locked |
| **Auto-Reset** | `Yes` | Account automatically unlocks after timeout |
| **Manual Unlock** | `Yes` (Admin) | Admins can unlock accounts manually |
| **Reset on Success** | `Yes` | Login attempts reset to 0 on successful login |

---

## 🎯 Quick Answers

### **Q: How many attempts before lockout?**
**A:** **5 failed attempts**

### **Q: How long is the account locked?**
**A:** **30 minutes**

### **Q: Does it auto-unlock?**
**A:** **Yes**, automatically after 30 minutes

### **Q: Can I manually unlock?**
**A:** **Yes**, if you're an admin using the unlock API

### **Q: Do attempts reset on successful login?**
**A:** **Yes**, login attempts reset to 0 on successful login

---

## 🧪 Testing Lockout

### **Test Lockout Behavior:**
```bash
# Attempt 1-4 (will fail but not lock)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{"email": "user@example.com", "password": "wrongpass"}'

# Attempt 5 (will lock account)
# Same request as above - account now locked

# Try to login while locked (will return 423)
# Response: "Account is temporarily locked due to too many failed attempts"
```

---

## 📚 Related Files

- **Controller:** `controllers/authController.js` (Lines 247-277)
- **Admin Controller:** `controllers/adminController.js` (Lines 271-305)
- **Database Schema:** `database/schema.sql`
- **System Settings:** `system_settings` table

---

## 💡 Recommendations

1. **Display Lockout Time:** Show users how much time remains until unlock
2. **Email Notification:** Send email when account gets locked
3. **Graduated Lockout:** Increase lockout time with repeated lockouts
4. **IP-Based Tracking:** Consider IP-based lockout to prevent distributed attacks
5. **Recovery Option:** Provide account recovery option after lockout

---

**Last Updated:** 2024  
**Version:** 1.0

