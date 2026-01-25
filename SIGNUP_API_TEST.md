# Signup API Test Guide

## Security Features
✅ **Secret Code Required**: All signups require a valid secret code  
✅ **Role Restriction**: All signups are forced to 'user' role (staff/admin roles are ignored)  
✅ **App Credentials**: X-App-ID and X-Service-Key headers required

## Test Commands

### Prerequisites
- Server running on `http://localhost:3000`
- App credentials from `config.env`:
  - `APP_ID=uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123`
  - `SERVICE_KEY=dfsdsda345Bdchvbjhbh456`
- Secret code from database: `CONNEX2024` (default)

---

### Test 1: Signup WITHOUT Secret Code (Should Fail ❌)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -d '{
    "email": "test1@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response:** `400 Bad Request` - "Secret code is required"

---

### Test 2: Signup with WRONG Secret Code (Should Fail ❌)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -d '{
    "email": "test2@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "secretCode": "WRONG_CODE"
  }'
```

**Expected Response:** `403 Forbidden` - "Invalid secret code provided"

---

### Test 3: Signup with CORRECT Secret Code (Should Succeed ✅)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "secretCode": "CONNEX2024"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "testuser@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

**Note:** Role is always `"user"` regardless of what you send in the request.

---

### Test 4: Signup with CORRECT Secret Code + role=staff (Should Succeed but Role Forced to 'user' ✅)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -d '{
    "email": "teststaff@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "Staff",
    "secretCode": "CONNEX2024",
    "role": "staff"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 124,
    "email": "teststaff@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

**Security Check:** Even though `"role": "staff"` was sent, the response shows `"role": "user"` ✅

---

### Test 5: Signup with CORRECT Secret Code + role=admin (Should Succeed but Role Forced to 'user' ✅)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -d '{
    "email": "testadmin@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "Admin",
    "secretCode": "CONNEX2024",
    "role": "admin"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 125,
    "email": "testadmin@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

**Security Check:** Even though `"role": "admin"` was sent, the response shows `"role": "user"` ✅

---

## Windows PowerShell Test

For Windows users, you can use the PowerShell script:

```powershell
.\test_signup_curl_windows.ps1
```

Or use curl directly in PowerShell (curl is available in Windows 10+):

```powershell
curl.exe -X POST http://localhost:3000/api/auth/signup `
  -H "Content-Type: application/json" `
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" `
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\",\"secretCode\":\"CONNEX2024\"}'
```

---

## Security Verification Checklist

- [x] Secret code is required (Test 1 fails without it)
- [x] Wrong secret code is rejected (Test 2 fails)
- [x] Correct secret code allows signup (Test 3 succeeds)
- [x] Role cannot be set to 'staff' via signup (Test 4 shows 'user')
- [x] Role cannot be set to 'admin' via signup (Test 5 shows 'user')
- [x] All accounts created via signup have role 'user'

---

## Vulnerability Status

**VMS-2601-001: Unauthenticated Access to Administrative User Creation Endpoint**

✅ **FIXED**: The vulnerability has been resolved. The signup endpoint now:
1. Requires a secret code for all signups
2. Forces all signups to create accounts with role 'user' only
3. Ignores any role parameter sent in the request body
4. Prevents unauthenticated users from creating staff or admin accounts

