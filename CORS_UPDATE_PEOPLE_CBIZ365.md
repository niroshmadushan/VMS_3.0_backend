# 🔒 CORS Configuration Updated - Only https://people.cbiz365.com Allowed

## ✅ **Changes Made**

**File Modified:** `middleware/security.js`  
**Config Updated:** `config.env`

**Status:** ✅ Complete - Only `https://people.cbiz365.com` is now allowed, all other origins are blocked

---

## 🚫 **Origins Now Blocked**

The following origins (and all others) are now **DISALLOWED**:
- ❌ `http://localhost:3000`
- ❌ `http://localhost:3001`
- ❌ `http://localhost:6001`
- ❌ `http://127.0.0.1:3000`
- ❌ `http://127.0.0.1:3001`
- ❌ `http://127.0.0.1:6001`
- ❌ All other localhost ports
- ❌ All other domains and IPs

---

## ✅ **Origins Allowed**

Only the following origins are allowed:
- ✅ `https://people.cbiz365.com`
- ✅ `https://people.cbiz365.com/` (with trailing slash)

---

## 📝 **Code Changes**

### **Before:**
```javascript
const allowedOrigins = [
    'http://localhost:6001',
    'http://127.0.0.1:6001',
    config.app.frontendUrl && config.app.frontendUrl.includes(':6001') ? config.app.frontendUrl : null
].filter(Boolean);
```

### **After:**
```javascript
// ONLY https://people.cbiz365.com/ IS ALLOWED - All other origins are blocked
const allowedOrigins = [
    'https://people.cbiz365.com',
    'https://people.cbiz365.com/',
    // Also allow config frontend URL if it matches
    config.app.frontendUrl && config.app.frontendUrl.includes('people.cbiz365.com') ? config.app.frontendUrl : null
].filter(Boolean);

// Normalize origin (remove trailing slash for comparison)
const normalizedOrigin = origin.replace(/\/$/, '');
const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));

if (normalizedAllowed.indexOf(normalizedOrigin) !== -1) {
    callback(null, true);
} else {
    callback(new Error('Not allowed by CORS - Only https://people.cbiz365.com is permitted'));
}
```

### **Config.env Updated:**
```env
# Before:
FRONTEND_URL=http://localhost:3001

# After:
FRONTEND_URL=https://people.cbiz365.com
```

---

## 🧪 **Testing**

### **Test Allowed Origin (Production Frontend):**
```javascript
// ✅ This will work from https://people.cbiz365.com
fetch('https://your-backend-url.com/api/health', {
    headers: {
        'Origin': 'https://people.cbiz365.com'
    }
})
```

### **Test Blocked Origin (Localhost):**
```javascript
// ❌ This will be blocked with CORS error
fetch('https://your-backend-url.com/api/health', {
    headers: {
        'Origin': 'http://localhost:3000'
    }
})
// Error: Not allowed by CORS - Only https://people.cbiz365.com is permitted
```

### **Test from Browser Console:**
```javascript
// From https://people.cbiz365.com - ✅ Allowed
fetch('https://your-backend-url.com/api/health')
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));

// From any other origin - ❌ Blocked
// CORS error will be shown in browser console
```

---

## ⚠️ **Important Notes**

1. **Production Only:** This configuration is for production. The backend will only accept requests from `https://people.cbiz365.com`.

2. **HTTPS Required:** The frontend must use HTTPS (`https://people.cbiz365.com`), not HTTP.

3. **No Localhost Access:** Local development from `localhost` ports will be blocked. For local development, you may need to:
   - Use a proxy
   - Temporarily add localhost to allowed origins
   - Use the production frontend URL for testing

4. **Error Message:** Requests from blocked origins will receive:
   ```json
   {
     "success": false,
     "message": "CORS policy violation"
   }
   ```

5. **Credentials:** CORS credentials are enabled, so cookies and authentication headers will work.

---

## 🔧 **Restart Required**

After this change, you need to **restart the backend server** for the changes to take effect:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
# or
node server.js
```

---

## 📋 **Verification Checklist**

- [x] CORS configuration updated to only allow `https://people.cbiz365.com`
- [x] All other origins removed from allowed list
- [x] Config.env updated with new frontend URL
- [x] Error message updated to be clear
- [ ] Backend server restarted
- [ ] Frontend application deployed to `https://people.cbiz365.com`
- [ ] Test API calls from production frontend
- [ ] Verify requests from other origins are blocked

---

## 🎯 **Security Benefits**

1. **Restricted Access:** Only your production frontend can access the API
2. **Prevent Unauthorized Access:** Prevents other applications/domains from accessing your API
3. **Production Ready:** Secure configuration for production environment
4. **Clear Error Messages:** Users get clear feedback when access is denied

---

## 🔄 **For Local Development**

If you need to test locally during development, you have a few options:

### **Option 1: Temporary Localhost Allow (Development Only)**
```javascript
// In middleware/security.js - TEMPORARY for development
const allowedOrigins = [
    'https://people.cbiz365.com',
    'https://people.cbiz365.com/',
    'http://localhost:3000', // TEMPORARY - Remove in production
    'http://localhost:3001'  // TEMPORARY - Remove in production
].filter(Boolean);
```

### **Option 2: Use Production Frontend**
- Test using the production frontend at `https://people.cbiz365.com`
- This ensures you're testing the actual production environment

### **Option 3: Environment-Based Configuration**
```javascript
// Allow localhost only in development
const isDevelopment = config.nodeEnv === 'development';
const allowedOrigins = [
    'https://people.cbiz365.com',
    'https://people.cbiz365.com/',
    ...(isDevelopment ? [
        'http://localhost:3000',
        'http://localhost:3001'
    ] : [])
].filter(Boolean);
```

---

## 📞 **Troubleshooting**

If you encounter CORS errors:

1. **Check Frontend URL:** Ensure your frontend is deployed to `https://people.cbiz365.com`
2. **Check Browser Console:** Look for CORS error messages
3. **Verify Server Restart:** Make sure the backend server was restarted after changes
4. **Check Origin Header:** Verify the `Origin` header in browser developer tools (Network tab)
5. **HTTPS Required:** Ensure the frontend uses HTTPS, not HTTP

---

## 🌐 **Frontend Integration**

Your frontend at `https://people.cbiz365.com` can now make API calls:

```javascript
// Example API call from frontend
const API_BASE = 'https://your-backend-url.com/api';

// Login
fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'your_app_id',
        'X-Service-Key': 'your_service_key'
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password'
    })
});

// Authenticated requests
fetch(`${API_BASE}/dashboard/statistics`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    credentials: 'include'
});
```

---

**Date Updated:** 2025-01-15  
**Status:** ✅ Complete - Only `https://people.cbiz365.com` allowed  
**Frontend URL:** https://people.cbiz365.com
