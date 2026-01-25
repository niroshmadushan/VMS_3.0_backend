# Signup API Test Script for Windows PowerShell
# This script tests the signup endpoint with security code validation

$BASE_URL = "http://localhost:3000"
$API_ENDPOINT = "/api/auth/signup"

# App credentials from config.env
$APP_ID = "uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123"
$SERVICE_KEY = "dfsdsda345Bdchvbjhbh456"

# Secret code from database (default: CONNEX2024)
$SECRET_CODE = "CONNEX2024"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Signup API Security Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Signup WITHOUT secret code (should fail)
Write-Host "Test 1: Signup WITHOUT secret code (should fail)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$body1 = @{
    email = "test1@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$BASE_URL$API_ENDPOINT" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-App-ID" = $APP_ID
            "X-Service-Key" = $SERVICE_KEY
        } `
        -Body $body1 `
        -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error (Expected):" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# Test 2: Signup with WRONG secret code (should fail)
Write-Host "Test 2: Signup with WRONG secret code (should fail)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$body2 = @{
    email = "test2@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
    secretCode = "WRONG_CODE"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL$API_ENDPOINT" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-App-ID" = $APP_ID
            "X-Service-Key" = $SERVICE_KEY
        } `
        -Body $body2 `
        -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error (Expected):" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# Test 3: Signup with CORRECT secret code (should succeed)
Write-Host "Test 3: Signup with CORRECT secret code (should succeed)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body3 = @{
    email = "test$timestamp@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
    secretCode = $SECRET_CODE
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$BASE_URL$API_ENDPOINT" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-App-ID" = $APP_ID
            "X-Service-Key" = $SERVICE_KEY
        } `
        -Body $body3 `
        -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 10
    Write-Host "`n✅ Account created with role: $($response3.data.role)" -ForegroundColor Green
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# Test 4: Signup with CORRECT secret code but trying to set role=staff (should be ignored, role forced to 'user')
Write-Host "Test 4: Signup with role=staff attempt (should be ignored, role forced to 'user')" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$timestamp2 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body4 = @{
    email = "teststaff$timestamp2@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "Staff"
    secretCode = $SECRET_CODE
    role = "staff"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "$BASE_URL$API_ENDPOINT" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-App-ID" = $APP_ID
            "X-Service-Key" = $SERVICE_KEY
        } `
        -Body $body4 `
        -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $response4 | ConvertTo-Json -Depth 10
    if ($response4.data.role -eq "user") {
        Write-Host "`n✅ Security Fix Working: Role forced to 'user' (staff role ignored)" -ForegroundColor Green
    } else {
        Write-Host "`n❌ SECURITY ISSUE: Role is $($response4.data.role) instead of 'user'" -ForegroundColor Red
    }
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

# Test 5: Signup with CORRECT secret code but trying to set role=admin (should be ignored, role forced to 'user')
Write-Host "Test 5: Signup with role=admin attempt (should be ignored, role forced to 'user')" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$timestamp3 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body5 = @{
    email = "testadmin$timestamp3@example.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "Admin"
    secretCode = $SECRET_CODE
    role = "admin"
} | ConvertTo-Json

try {
    $response5 = Invoke-RestMethod -Uri "$BASE_URL$API_ENDPOINT" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-App-ID" = $APP_ID
            "X-Service-Key" = $SERVICE_KEY
        } `
        -Body $body5 `
        -ErrorAction Stop
    Write-Host "Response:" -ForegroundColor Green
    $response5 | ConvertTo-Json -Depth 10
    if ($response5.data.role -eq "user") {
        Write-Host "`n✅ Security Fix Working: Role forced to 'user' (admin role ignored)" -ForegroundColor Green
    } else {
        Write-Host "`n❌ SECURITY ISSUE: Role is $($response5.data.role) instead of 'user'" -ForegroundColor Red
    }
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tests completed!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

