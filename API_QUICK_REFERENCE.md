# 🚀 API Quick Reference

## 🔐 **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | User registration | ❌ |
| `POST` | `/api/auth/verify-email` | Email verification | ❌ |
| `POST` | `/api/auth/login` | User login (sends OTP) | ❌ |
| `POST` | `/api/auth/verify-otp` | Complete login with OTP | ❌ |
| `POST` | `/api/auth/password-reset` | Request password reset | ❌ |
| `POST` | `/api/auth/password-reset/verify-otp` | Verify reset OTP | ❌ |
| `POST` | `/api/auth/password-reset/confirm` | Complete password reset | ❌ |
| `POST` | `/api/auth/change-password` | Change password | ✅ |
| `POST` | `/api/auth/validate-token` | Validate JWT token | ❌ |
| `POST` | `/api/auth/refresh-token` | Refresh JWT token | ❌ |
| `POST` | `/api/auth/logout` | Logout current session | ✅ |
| `POST` | `/api/auth/logout-all` | Logout all sessions | ✅ |
| `GET` | `/api/auth/sessions` | Get user sessions | ✅ |
| `DELETE` | `/api/auth/sessions/:id` | Terminate session | ✅ |

## 👑 **Admin Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/admin/users` | Get all users | ✅ Admin |
| `GET` | `/api/admin/users/:id` | Get user by ID | ✅ Admin |
| `PUT` | `/api/admin/users/:id/role` | Update user role | ✅ Admin |
| `PUT` | `/api/admin/users/:id/lock` | Toggle user lock | ✅ Admin |
| `DELETE` | `/api/admin/users/:id` | Delete user | ✅ Admin |
| `GET` | `/api/admin/stats` | System statistics | ✅ Admin |
| `GET` | `/api/admin/analytics/logins` | Login analytics | ✅ Admin |

## 🌐 **System Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/` | API information |
| `GET` | `/verify-email` | Email verification page |

## 📋 **Required Headers**

```http
Content-Type: application/json
X-App-ID: your_unique_app_id_here
X-Service-Key: your_service_key_here
Authorization: Bearer <jwt-token>  # For authenticated endpoints
```

## 🔒 **Rate Limits**

- **Auth Endpoints**: 5 requests / 15 minutes
- **OTP Endpoints**: 3 requests / 10 minutes
- **Password Reset**: 3 requests / hour

## 🎯 **Quick Test Commands**

### Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_unique_app_id_here" \
  -H "X-Service-Key: your_service_key_here" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe","password":"Pass123!","role":"user"}'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-ID: your_unique_app_id_here" \
  -H "X-Service-Key: your_service_key_here" \
  -d '{"email":"test@example.com","password":"Pass123!"}'
```

### Test Health
```bash
curl http://localhost:3000/health
```

