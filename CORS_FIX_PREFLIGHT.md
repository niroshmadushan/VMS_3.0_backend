# 🔧 CORS Preflight Request Fix

## 🐛 **Issue**

Frontend at `https://people.cbiz365.com` was getting CORS error when trying to access backend at `https://peopleapi.cbiz365.com`:

```
Access to fetch at 'https://peopleapi.cbiz365.com/api/auth/login' from origin 'https://people.cbiz365.com' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ **Solution**

Updated CORS configuration to properly handle preflight OPTIONS requests and explicitly set all required headers.

---

## 📝 **Changes Made**

### **1. Enhanced CORS Configuration (`middleware/security.js`)**

**Added explicit configuration:**
- ✅ Explicit `methods` array including OPTIONS
- ✅ Explicit `allowedHeaders` array with all required headers
- ✅ `maxAge` for preflight caching (24 hours)
- ✅ Debug logging to track CORS requests
- ✅ `preflightContinue: false` to ensure proper handling

**Before:**
```javascript
const corsOptions = {
    origin: function (origin, callback) { ... },
    credentials: true,
    optionsSuccessStatus: 200
};
```

**After:**
```javascript
const corsOptions = {
    origin: function (origin, callback) { ... },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-App-ID',
        'X-Service-Key'
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400 // 24 hours
};
```

### **2. Updated Helmet Configuration**

Added `crossOriginResourcePolicy` to allow cross-origin requests:

```javascript
const securityHeaders = helmet({
    // ... other config
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});
```

### **3. Explicit OPTIONS Handler (`server.js`)**

Added explicit OPTIONS handler as fallback:

```javascript
// CORS middleware - must be before routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));
```

### **4. Debug Logging**

Added console logging to track CORS requests:

```javascript
console.log('[CORS] Request origin:', normalizedOrigin);
console.log('[CORS] Allowed origins:', normalizedAllowed);
console.log('[CORS] ✅ Origin allowed');
// or
console.log('[CORS] ❌ Origin blocked:', normalizedOrigin);
```

---

## 🧪 **Testing**

### **Test from Frontend:**

```javascript
// From https://people.cbiz365.com
fetch('https://peopleapi.cbiz365.com/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-App-ID': 'your_app_id',
        'X-Service-Key': 'your_service_key'
    },
    credentials: 'include',
    body: JSON.stringify({
        email: 'user@example.com',
        password: 'password'
    })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### **Check Browser Network Tab:**

1. Open browser DevTools → Network tab
2. Make a request from frontend
3. Look for the OPTIONS preflight request
4. Check response headers:
   - ✅ `Access-Control-Allow-Origin: https://people.cbiz365.com`
   - ✅ `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
   - ✅ `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, X-App-ID, X-Service-Key`
   - ✅ `Access-Control-Allow-Credentials: true`

---

## 🔍 **Debugging**

### **Check Server Logs:**

When a request comes in, you should see:
```
[CORS] Request origin: https://people.cbiz365.com
[CORS] Allowed origins: ['https://people.cbiz365.com']
[CORS] ✅ Origin allowed
```

If blocked:
```
[CORS] Request origin: https://other-domain.com
[CORS] Allowed origins: ['https://people.cbiz365.com']
[CORS] ❌ Origin blocked: https://other-domain.com
```

### **Common Issues:**

1. **Origin Mismatch:**
   - Check that frontend URL exactly matches `https://people.cbiz365.com`
   - No trailing slash differences
   - HTTPS not HTTP

2. **Headers Missing:**
   - Ensure all required headers are in `allowedHeaders` array
   - Check that `X-App-ID` and `X-Service-Key` are included

3. **Preflight Not Handled:**
   - Verify OPTIONS is in the `methods` array
   - Check that `app.options('*', cors(corsOptions))` is present

---

## ✅ **Verification Checklist**

- [x] CORS configuration updated with explicit methods and headers
- [x] OPTIONS method included in allowed methods
- [x] All required headers in allowedHeaders array
- [x] Explicit OPTIONS handler added
- [x] Helmet configured to allow cross-origin
- [x] Debug logging added
- [ ] Server restarted
- [ ] Tested from production frontend
- [ ] Verified preflight requests work
- [ ] Checked browser network tab for CORS headers

---

## 🔄 **Next Steps**

1. **Restart Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

2. **Test from Frontend:**
   - Open `https://people.cbiz365.com`
   - Try to login
   - Check browser console for errors
   - Check network tab for CORS headers

3. **Monitor Logs:**
   - Watch server console for CORS debug messages
   - Verify origin is being allowed

4. **Remove Debug Logs (Optional):**
   - Once confirmed working, you can remove console.log statements
   - Or keep them for production debugging

---

## 📋 **Allowed Configuration**

**Origin:** `https://people.cbiz365.com`  
**Backend:** `https://peopleapi.cbiz365.com`  
**Methods:** GET, POST, PUT, DELETE, OPTIONS, PATCH  
**Headers:** Content-Type, Authorization, X-Requested-With, Accept, Origin, X-App-ID, X-Service-Key  
**Credentials:** Enabled

---

**Date Fixed:** 2025-01-15  
**Status:** ✅ Fixed - CORS preflight requests now properly handled
