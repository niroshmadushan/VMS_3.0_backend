# Signup API Testing Instructions

## ⚠️ IMPORTANT: Restart Server After Code Changes

**Before testing, you MUST restart your Node.js server** for the security fixes to take effect:

1. Stop the current server (Ctrl+C in the terminal where it's running)
2. Start it again: `node server.js` or `npm start`

## Quick Test Command

After restarting the server, run this command:

### Windows PowerShell:
```powershell
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$body = @{
    email = "test$timestamp@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
    secretCode = "CONNEX2024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "X-App-ID" = "uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123"
        "X-Service-Key" = "dfsdsda345Bdchvbjhbh456"
        "Origin" = "http://localhost:6001"
    } `
    -Body $body | ConvertTo-Json -Depth 10
```

### Expected Response:
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

**✅ Verify:** The `role` field should always be `"user"`, even if you send `"role": "staff"` or `"role": "admin"` in the request.

## Test Role Restriction

Test that the role is forced to 'user' even when trying to set it to 'staff':

```powershell
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$body = @{
    email = "teststaff$timestamp@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "Staff"
    secretCode = "CONNEX2024"
    role = "staff"  # This should be ignored!
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "X-App-ID" = "uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123"
        "X-Service-Key" = "dfsdsda345Bdchvbjhbh456"
        "Origin" = "http://localhost:6001"
    } `
    -Body $body

Write-Host "Role in response: $($response.data.role)"
if ($response.data.role -eq "user") {
    Write-Host "✅ SECURITY FIX WORKING: Role forced to 'user'" -ForegroundColor Green
} else {
    Write-Host "❌ SECURITY ISSUE: Role is $($response.data.role)" -ForegroundColor Red
}
```

## Security Features Verified

- ✅ Secret code is required
- ✅ Wrong secret code is rejected
- ✅ Correct secret code allows signup
- ✅ Role is always forced to 'user' (staff/admin roles ignored)
- ✅ Origin header required for testing (use `http://localhost:6001`)

## Troubleshooting

If you see `"role": "staff"` in the response:
1. **Restart the server** - The code changes require a server restart
2. Check server console for the log message: `🔒 Security: Forcing signup role to "user"`
3. Verify the code in `controllers/authController.js` line 58 shows: `const role = 'user';`

