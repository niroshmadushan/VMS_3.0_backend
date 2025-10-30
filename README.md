# Advanced Express.js Authentication Backend

A comprehensive, production-ready authentication system built with Express.js, MySQL, and advanced security features.

## 🚀 Features

### Core Authentication
- **Advanced Signup**: Email validation, role assignment, customizable profile fields
- **Email Verification**: Secure email confirmation with token-based verification
- **Two-Factor Login**: Email OTP verification for enhanced security
- **Password Reset**: OTP-based password reset functionality
- **Session Management**: JWT-based sessions with refresh tokens
- **Role-Based Access Control**: Admin, User, and Moderator roles

### Security Features
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Account Lockout**: Automatic lockout after failed login attempts
- **Input Sanitization**: XSS protection and input validation
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS policies
- **Request Logging**: Comprehensive API usage tracking

### Admin Dashboard
- **User Management**: View, edit, lock/unlock users
- **Analytics**: Login trends, user statistics, system metrics
- **Real-time Monitoring**: Active sessions, failed attempts tracking
- **Role Management**: Change user roles and permissions

### Database Features
- **MySQL Integration**: Robust database schema with relationships
- **Transaction Support**: ACID compliance for critical operations
- **Optimized Queries**: Indexed tables for performance
- **Data Integrity**: Foreign key constraints and validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (optional, for session storage)
- SMTP server (Gmail, SendGrid, etc.)

## 🛠️ Installation

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd express-auth-backend

# Install dependencies
npm install
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE auth_system;

# Import schema
mysql -u root -p auth_system < database/schema.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp config.env .env

# Edit configuration
nano .env
```

Update the following variables in your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=auth_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@yourapp.com

# Application Configuration
APP_ID=your_unique_app_id_here
SERVICE_KEY=your_service_key_here
FRONTEND_URL=http://localhost:3001
```

### 4. Gmail SMTP Setup (if using Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password in `SMTP_PASS`

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Headers
All API requests require these headers:
```
X-App-ID: your_app_id_here
X-Service-Key: your_service_key_here
Authorization: Bearer your_jwt_token_here (for protected routes)
```

### Authentication Endpoints

#### 1. User Signup
```http
POST /api/auth/signup
Content-Type: application/json
X-App-ID: your_app_id
X-Service-Key: your_service_key

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "phone": "+1234567890",
  "customField1": "value1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "verificationRequired": true
  }
}
```

#### 2. Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

#### 3. User Login
```http
POST /api/auth/login
Content-Type: application/json
X-App-ID: your_app_id
X-Service-Key: your_service_key

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

#### 4. OTP Verification
```http
POST /api/auth/verify-otp
Content-Type: application/json

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
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "session": {
      "token": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### 5. Password Reset Request
```http
POST /api/auth/password-reset
Content-Type: application/json
X-App-ID: your_app_id
X-Service-Key: your_service_key

{
  "email": "user@example.com"
}
```

#### 6. Password Reset OTP Verification
```http
POST /api/auth/password-reset/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

#### 7. Password Reset Confirmation
```http
POST /api/auth/password-reset/confirm
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

#### 8. Token Validation
```http
POST /api/auth/validate-token
Content-Type: application/json
Authorization: Bearer your_jwt_token
```

#### 9. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### 10. Logout
```http
POST /api/auth/logout
Authorization: Bearer your_jwt_token
```

### Admin Endpoints

#### 1. Get All Users (with pagination and filters)
```http
GET /api/admin/users?page=1&limit=10&search=john&role=user&verified=true
Authorization: Bearer admin_jwt_token
```

#### 2. Get User Details
```http
GET /api/admin/users/123
Authorization: Bearer admin_jwt_token
```

#### 3. Update User Role
```http
PUT /api/admin/users/123/role
Content-Type: application/json
Authorization: Bearer admin_jwt_token

{
  "role": "moderator"
}
```

#### 4. Lock/Unlock User
```http
PUT /api/admin/users/123/lock
Content-Type: application/json
Authorization: Bearer admin_jwt_token

{
  "locked": true
}
```

#### 5. Delete User
```http
DELETE /api/admin/users/123
Authorization: Bearer admin_jwt_token
```

#### 6. Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer admin_jwt_token
```

#### 7. Get Login Analytics
```http
GET /api/admin/analytics/logins?period=7
Authorization: Bearer admin_jwt_token
```

## 🎯 Admin Dashboard

Access the admin dashboard at: `http://localhost:3000/admin`

### Dashboard Features:
- **Overview**: Total users, verified users, active sessions, failed attempts
- **User Management**: Search, filter, edit users, manage roles
- **Analytics**: Login trends, hourly activity, registration statistics
- **Real-time Data**: Live updates of system metrics

### Admin Login:
To access the admin dashboard, you need an admin account. Create one by:

1. Sign up normally through the API
2. Update the role in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

## 🔒 Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per hour
- **OTP Requests**: 3 requests per 5 minutes

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Security
- Email verification required
- Account lockout after 5 failed attempts
- Session management with refresh tokens
- Automatic session invalidation on password change

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Security headers with Helmet.js

## 📊 Database Schema

### Users Table
- `id`: Primary key
- `email`: Unique email address
- `password`: Hashed password
- `role`: User role (admin, user, moderator)
- `is_email_verified`: Email verification status
- `login_attempts`: Failed login counter
- `locked_until`: Account lockout timestamp

### Profiles Table
- `user_id`: Foreign key to users
- `first_name`, `last_name`: User names
- `phone`, `address`, `city`, `state`, `country`: Contact info
- `custom_fields`: JSON field for additional data

### User Sessions Table
- Session tracking with device info
- IP address and user agent logging
- Token management with expiration

### OTP Codes Table
- OTP storage with expiration
- Support for different OTP types
- Automatic cleanup of expired codes

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Use production database
# Update .env with production database credentials
```

### 2. Security Considerations
- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS origins
- Set up proper firewall rules
- Use environment variables for secrets

### 3. Performance Optimization
- Enable MySQL query caching
- Use Redis for session storage
- Implement database connection pooling
- Add load balancing for high traffic

### 4. Monitoring
- Set up logging with Winston
- Monitor API response times
- Track failed login attempts
- Set up alerts for security events

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific endpoints
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_app_id" \
  -H "X-Service-Key: your_service_key" \
  -d '{"email":"test@example.com","password":"TestPass123!","firstName":"Test","lastName":"User"}'
```

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Optional data object
  "errors": [] // Optional validation errors
}
```

## 🔧 Configuration

### System Settings
The system includes configurable settings stored in the `system_settings` table:

- `max_login_attempts`: Maximum failed login attempts (default: 5)
- `lockout_duration`: Account lockout duration in minutes (default: 30)
- `session_timeout`: Session timeout in hours (default: 24)
- `password_min_length`: Minimum password length (default: 8)
- `require_email_verification`: Require email verification (default: true)
- `allow_registration`: Allow new user registration (default: true)
- `maintenance_mode`: Enable maintenance mode (default: false)

## 📞 Support

For issues and questions:
1. Check the logs for error messages
2. Verify database connection
3. Ensure all environment variables are set
4. Check SMTP configuration for email functionality

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for secure authentication**

