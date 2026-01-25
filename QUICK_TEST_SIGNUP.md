# Quick Signup API Test

## ✅ Server Status: Running

## Quick Test Command

Copy and paste this command to test the signup API with security code:

### Windows PowerShell:
```powershell
curl.exe -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" -H "Origin: http://localhost:6001" -d "{\"email\":\"test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\",\"secretCode\":\"CONNEX2024\"}"
```

**Note:** Add `-H "Origin: http://localhost:6001"` header to bypass security middleware for testing.

### Linux/Mac/Git Bash:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" \
  -H "Origin: http://localhost:6001" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "secretCode": "CONNEX2024"
  }'
```

**Note:** Add `-H "Origin: http://localhost:6001"` header to bypass security middleware for testing.

## Expected Response (Success):
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "test...@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

## Test Without Secret Code (Should Fail):
```powershell
curl.exe -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" -H "Origin: http://localhost:6001" -d "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
```

**Expected:** `400 Bad Request` - "Secret code is required"

## Test with Wrong Secret Code (Should Fail):
```powershell
curl.exe -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" -H "Origin: http://localhost:6001" -d "{\"email\":\"test@example.com\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\",\"secretCode\":\"WRONG\"}"
```

**Expected:** `403 Forbidden` - "Invalid secret code provided"

## Test Role Restriction (Should Force 'user' role):
```powershell
curl.exe -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -H "X-App-ID: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" -H "X-Service-Key: dfsdsda345Bdchvbjhbh456" -H "Origin: http://localhost:6001" -d "{\"email\":\"teststaff$(Get-Date -Format 'yyyyMMddHHmmss')@example.com\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"Staff\",\"secretCode\":\"CONNEX2024\",\"role\":\"staff\"}"
```

**Expected:** Response shows `"role": "user"` (not "staff") ✅

