# 🔐 Secure Signup API Documentation

## Overview

The Secure Signup API provides enhanced security features including:
- Secret code validation from database
- Email domain restriction (only allowed company domains)
- Stronger password requirements
- Enhanced input validation

---

## 📋 **Endpoint**

**POST** `/api/auth/secure-signup`

**Base URL:** `http://localhost:3000/api/auth/secure-signup`

---

## 🔑 **Required Headers**

```
Content-Type: application/json
X-App-ID: your_unique_app_id_here
X-Service-Key: your_service_key_here
```

---

## 📝 **Request Body**

```json
{
  "email": "user@connexit.biz",
  "password": "SecurePass123!@#",
  "firstName": "John",
  "lastName": "Doe",
  "secretCode": "CONNEX2024",
  "role": "user"
}
```

### **Field Requirements:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Must be from allowed domains only |
| `password` | string | Yes | Min 12 chars, uppercase, lowercase, number, special char |
| `firstName` | string | Yes | 2-50 chars, letters/spaces/hyphens/apostrophes only |
| `lastName` | string | Yes | 2-50 chars, letters/spaces/hyphens/apostrophes only |
| `secretCode` | string | Yes | Must exist in `secret_tbl` and be active |
| `role` | string | No | Default: 'user'. Allowed: 'user', 'staff', 'assistant' |

---

## ✅ **Allowed Email Domains**

Only emails from these domains are allowed:
- `connexit.biz`
- `connexcodeworks.biz`
- `conex360.biz`
- `connexvectra.biz`

---

## 🔒 **Password Requirements**

- **Minimum length:** 12 characters
- **Must contain:**
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/)

---

## 🎫 **Secret Code Validation**

The secret code must:
1. Exist in the `secret_tbl` table
2. Be active (`is_active = TRUE`)
3. Not be expired (if `expires_at` is set)
4. Not exceed maximum uses (if `max_uses` is set)

---

## 📤 **Response Examples**

### **Success Response (201 Created)**

```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "user@connexit.biz",
    "role": "user",
    "verificationRequired": true,
    "emailDomain": "connexit.biz"
  }
}
```

### **Error Response - Invalid Secret Code (403 Forbidden)**

```json
{
  "success": false,
  "message": "Invalid or inactive secret code"
}
```

### **Error Response - Expired Secret Code (403 Forbidden)**

```json
{
  "success": false,
  "message": "Secret code has expired"
}
```

### **Error Response - Max Uses Reached (403 Forbidden)**

```json
{
  "success": false,
  "message": "Secret code has reached maximum usage limit"
}
```

### **Error Response - Invalid Email Domain (403 Forbidden)**

```json
{
  "success": false,
  "message": "Email must be from one of the allowed domains: connexit.biz, connexcodeworks.biz, conex360.biz, connexvectra.biz"
}
```

### **Error Response - Email Already Exists (409 Conflict)**

```json
{
  "success": false,
  "message": "Email address already registered"
}
```

### **Error Response - Validation Failed (400 Bad Request)**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 12 characters long",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "Secret code is required",
      "param": "secretCode",
      "location": "body"
    }
  ]
}
```

---

## 💻 **Usage Examples**

### **JavaScript/Fetch**

```javascript
const response = await fetch('http://localhost:3000/api/auth/secure-signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'your_app_id',
    'X-Service-Key': 'your_service_key'
  },
  body: JSON.stringify({
    email: 'john.doe@connexit.biz',
    password: 'SecurePass123!@#',
    firstName: 'John',
    lastName: 'Doe',
    secretCode: 'CONNEX2024',
    role: 'user'
  })
});

const data = await response.json();
console.log(data);
```

### **cURL**

```bash
curl -X POST http://localhost:3000/api/auth/secure-signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_app_id" \
  -H "X-Service-Key: your_service_key" \
  -d '{
    "email": "john.doe@connexit.biz",
    "password": "SecurePass123!@#",
    "firstName": "John",
    "lastName": "Doe",
    "secretCode": "CONNEX2024",
    "role": "user"
  }'
```

### **Axios**

```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:3000/api/auth/secure-signup', {
  email: 'john.doe@connexit.biz',
  password: 'SecurePass123!@#',
  firstName: 'John',
  lastName: 'Doe',
  secretCode: 'CONNEX2024',
  role: 'user'
}, {
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'your_app_id',
    'X-Service-Key': 'your_service_key'
  }
});

console.log(response.data);
```

---

## 🗄️ **Database Setup**

### **1. Create Secret Codes Table**

Run the SQL file:
```bash
mysql -u your_user -p your_database < database/secret_codes.sql
```

Or execute the SQL directly in your MySQL client.

### **2. Manage Secret Codes**

**Add a new secret code:**
```sql
INSERT INTO secret_tbl (secret_code, code_name, is_active, max_uses, expires_at) 
VALUES ('NEWCODE2024', 'New Signup Code', TRUE, 100, '2024-12-31 23:59:59');
```

**Deactivate a secret code:**
```sql
UPDATE secret_tbl SET is_active = FALSE WHERE secret_code = 'OLDCODE';
```

**Check secret code usage:**
```sql
SELECT secret_code, used_count, max_uses, expires_at, is_active 
FROM secret_tbl 
WHERE secret_code = 'CONNEX2024';
```

---

## 🔐 **Security Features**

1. **Secret Code Validation:** Prevents unauthorized signups
2. **Email Domain Restriction:** Only company emails allowed
3. **Strong Password Policy:** 12+ characters with complexity requirements
4. **Input Sanitization:** Names validated to prevent injection
5. **Transaction Safety:** All database operations in transaction
6. **Rate Limiting:** Applied via middleware
7. **Email Verification:** Required before account activation
8. **Usage Tracking:** Secret code usage counted and limited

---

## 📊 **Secret Code Management**

### **Secret Code Fields:**

- `secret_code`: The code users must provide (unique)
- `code_name`: Description/name of the code
- `is_active`: Whether the code is currently active
- `max_uses`: Maximum number of signups allowed (NULL = unlimited)
- `used_count`: Current number of signups using this code
- `expires_at`: Expiration date (NULL = never expires)

### **Best Practices:**

1. Use strong, unique secret codes
2. Set expiration dates for temporary codes
3. Set max_uses for limited signup campaigns
4. Regularly review and deactivate unused codes
5. Monitor used_count to track code usage

---

## ⚠️ **Important Notes**

1. **Email Domain:** Only emails from allowed domains can sign up
2. **Secret Code:** Must be provided and valid in database
3. **Password:** Minimum 12 characters with strong complexity
4. **Verification:** Email verification is required after signup
5. **Role:** Default is 'user'. Only 'user', 'staff', 'assistant' allowed (admin cannot be set via signup)

---

## 🔧 **Troubleshooting**

### **400 Bad Request Error**

If you're getting a 400 error, check the following:

1. **Check Required Headers:**
   ```javascript
   // Make sure these headers are included (case-insensitive)
   'X-App-ID': 'your_app_id'
   'X-Service-Key': 'your_service_key'
   ```

2. **Check Request Body Fields:**
   - `email` - Required, must be from allowed domain
   - `password` - Required, min 12 chars with complexity
   - `firstName` - Required, 2-50 chars
   - `lastName` - Required, 2-50 chars
   - `secretCode` - Required, must exist in database

3. **Check Validation Errors:**
   The API returns detailed validation errors:
   ```json
   {
     "success": false,
     "message": "Validation failed",
     "errors": [
       {
         "field": "password",
         "message": "Password must be at least 12 characters long",
         "value": "short"
       }
     ]
   }
   ```

4. **Common Issues:**
   - **Password too short:** Must be at least 12 characters
   - **Password missing complexity:** Must have uppercase, lowercase, number, and special character
   - **Invalid email domain:** Must be from: connexit.biz, connexcodeworks.biz, conex360.biz, connexvectra.biz
   - **Invalid name format:** Names can only contain letters, spaces, hyphens, and apostrophes
   - **Missing secret code:** Secret code field is required
   - **Secret code table missing:** Run `database/secret_codes.sql` first

5. **Test the API:**
   ```bash
   # Run the test script
   node test-secure-signup.js
   ```

6. **Check Server Logs:**
   The server console will show:
   - Request received with field presence
   - Validation errors
   - Database errors
   - Secret code validation results

---

## 🔄 **Next Steps After Signup**

1. User receives verification email with token
2. User calls `POST /api/auth/verify-email` with the token
3. After verification, user can login with `POST /api/auth/login`

---

**Last Updated:** 2025-01-15

