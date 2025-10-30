# 🔐 Authentication Backend API Documentation

## Base URL
```
http://localhost:3000
```

## Required Headers
All API requests require these headers:
```
Content-Type: application/json
X-App-ID: your_unique_app_id_here
X-Service-Key: your_service_key_here
```

---

## 📋 **Authentication APIs** (`/api/auth`)

### 1. **User Registration**
```http
POST /api/auth/signup
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!",
  "role": "user"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "emailVerificationRequired": true
  }
}
```

### 2. **Email Verification**
```http
POST /api/auth/verify-email
```
**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

### 3. **User Login**
```http
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "user@example.com",
    "otpRequired": true
  }
}
```

### 4. **OTP Verification (Complete Login)**
```http
POST /api/auth/verify-otp
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    },
    "sessionId": "session-id-here"
  }
}
```

### 5. **Password Reset Request**
```http
POST /api/auth/password-reset
```
**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 6. **Password Reset OTP Verification**
```http
POST /api/auth/password-reset/verify-otp
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

### 7. **Password Reset Confirmation**
```http
POST /api/auth/password-reset/confirm
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

### 8. **Change Password (Authenticated)**
```http
POST /api/auth/change-password
```
**Headers:** `Authorization: Bearer <jwt-token>`
**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

### 9. **Token Validation**
```http
POST /api/auth/validate-token
```
**Request Body:**
```json
{
  "token": "jwt-token-here"
}
```

### 10. **Refresh Token**
```http
POST /api/auth/refresh-token
```
**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

### 11. **Logout**
```http
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 12. **Logout All Devices**
```http
POST /api/auth/logout-all
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 13. **Get User Sessions**
```http
GET /api/auth/sessions
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 14. **Terminate Specific Session**
```http
DELETE /api/auth/sessions/:sessionId
```
**Headers:** `Authorization: Bearer <jwt-token>`

---

## 👑 **Admin APIs** (`/api/admin`)

*All admin routes require authentication and admin role*

### 1. **Get All Users**
```http
GET /api/admin/users
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 2. **Get User by ID**
```http
GET /api/admin/users/:userId
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 3. **Update User Role**
```http
PUT /api/admin/users/:userId/role
```
**Headers:** `Authorization: Bearer <jwt-token>`
**Request Body:**
```json
{
  "role": "admin"
}
```

### 4. **Toggle User Lock**
```http
PUT /api/admin/users/:userId/lock
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 5. **Delete User**
```http
DELETE /api/admin/users/:userId
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 6. **Get System Statistics**
```http
GET /api/admin/stats
```
**Headers:** `Authorization: Bearer <jwt-token>`

### 7. **Get Login Analytics**
```http
GET /api/admin/analytics/logins
```
**Headers:** `Authorization: Bearer <jwt-token>`

---

## 🌐 **System APIs**

### 1. **Health Check**
```http
GET /health
```

### 2. **API Information**
```http
GET /
```

### 3. **Email Verification Page**
```http
GET /verify-email?token=verification-token
```

---

## 🔒 **Security Features**

### Rate Limiting
- **Auth Endpoints**: 5 requests per 15 minutes
- **OTP Endpoints**: 3 requests per 10 minutes  
- **Password Reset**: 3 requests per hour

### Authentication Flow
1. **Signup** → Email verification required
2. **Login** → Password + OTP verification
3. **Password Reset** → Email + OTP + New password

### Token Management
- **JWT Tokens**: For API authentication
- **Session Tracking**: Multiple device support
- **Token Refresh**: Automatic token renewal
- **Logout**: Single or all devices

---

## 📧 **Email Integration**

### Email Types
- **Verification**: Email confirmation after signup
- **Login OTP**: Two-factor authentication
- **Password Reset**: Password recovery

### Email Service
- **Provider**: Resend SMTP
- **From**: onboarding@resend.dev
- **Features**: HTML templates, clickable buttons

---

## 🗄️ **Database Schema**

### Tables
- **users**: User accounts and authentication
- **profiles**: Customizable user profile data
- **sessions**: User session management
- **otp_codes**: OTP storage and validation
- **login_attempts**: Security tracking
- **api_usage**: API usage analytics
- **system_settings**: System configuration

---

## 🚀 **Quick Start Examples**

### Complete Signup Flow
```bash
# 1. Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_unique_app_id_here" \
  -H "X-Service-Key: your_service_key_here" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe","password":"Pass123!","role":"user"}'

# 2. Verify Email (click link in email)
# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_unique_app_id_here" \
  -H "X-Service-Key: your_service_key_here" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# 4. Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_unique_app_id_here" \
  -H "X-Service-Key: your_service_key_here" \
  -d '{"email":"test@example.com","otpCode":"123456"}'
```

---

## 📝 **Error Responses**

All APIs return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_ERROR`: Too many requests
- `EMAIL_ERROR`: Email sending failed
- `OTP_ERROR`: Invalid or expired OTP
- `TOKEN_ERROR`: Invalid or expired token
