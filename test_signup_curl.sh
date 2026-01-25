#!/bin/bash

# Signup API Test Script
# This script tests the signup endpoint with security code validation

BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/auth/signup"

# App credentials from config.env
APP_ID="uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123"
SERVICE_KEY="dfsdsda345Bdchvbjhbh456"

# Secret code from database (default: CONNEX2024)
SECRET_CODE="CONNEX2024"

echo "=========================================="
echo "Signup API Security Test"
echo "=========================================="
echo ""

# Test 1: Signup WITHOUT secret code (should fail)
echo "Test 1: Signup WITHOUT secret code (should fail)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-App-ID: ${APP_ID}" \
  -H "X-Service-Key: ${SERVICE_KEY}" \
  -d '{
    "email": "test1@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 2: Signup with WRONG secret code (should fail)
echo "Test 2: Signup with WRONG secret code (should fail)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-App-ID: ${APP_ID}" \
  -H "X-Service-Key: ${SERVICE_KEY}" \
  -d '{
    "email": "test2@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "secretCode": "WRONG_CODE"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 3: Signup with CORRECT secret code (should succeed)
echo "Test 3: Signup with CORRECT secret code (should succeed)"
echo "----------------------------------------"
TIMESTAMP=$(date +%s)
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-App-ID: ${APP_ID}" \
  -H "X-Service-Key: ${SERVICE_KEY}" \
  -d "{
    \"email\": \"test${TIMESTAMP}@example.com\",
    \"password\": \"Test123!@#\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"secretCode\": \"${SECRET_CODE}\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 4: Signup with CORRECT secret code but trying to set role=staff (should be ignored, role forced to 'user')
echo "Test 4: Signup with role=staff attempt (should be ignored, role forced to 'user')"
echo "----------------------------------------"
TIMESTAMP2=$(date +%s)
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-App-ID: ${APP_ID}" \
  -H "X-Service-Key: ${SERVICE_KEY}" \
  -d "{
    \"email\": \"teststaff${TIMESTAMP2}@example.com\",
    \"password\": \"Test123!@#\",
    \"firstName\": \"Test\",
    \"lastName\": \"Staff\",
    \"secretCode\": \"${SECRET_CODE}\",
    \"role\": \"staff\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 5: Signup with CORRECT secret code but trying to set role=admin (should be ignored, role forced to 'user')
echo "Test 5: Signup with role=admin attempt (should be ignored, role forced to 'user')"
echo "----------------------------------------"
TIMESTAMP3=$(date +%s)
curl -X POST "${BASE_URL}${API_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "X-App-ID: ${APP_ID}" \
  -H "X-Service-Key: ${SERVICE_KEY}" \
  -d "{
    \"email\": \"testadmin${TIMESTAMP3}@example.com\",
    \"password\": \"Test123!@#\",
    \"firstName\": \"Test\",
    \"lastName\": \"Admin\",
    \"secretCode\": \"${SECRET_CODE}\",
    \"role\": \"admin\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo "=========================================="
echo "Tests completed!"
echo "=========================================="

