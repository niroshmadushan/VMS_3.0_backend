# 📋 Validation Rules Guide - Sign Up & Update Operations

## 🎯 Overview

This guide documents all validation rules for sign-up, password updates, and profile updates in the backend system.

---

## 📝 1. Sign Up Validation Rules

**Endpoint:** `POST /api/auth/signup`

**Controller:** `controllers/authController.js`  
**Validation Array:** `signupValidation`

### Email Validation
```javascript
body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
```

**Rules:**
- ✅ Must be a valid email format
- ✅ Email is normalized (lowercase, trimmed)
- ❌ Invalid email format returns: "Please provide a valid email address"

**Example Valid Emails:**
- `user@example.com` ✅
- `John.Doe@company.co.uk` ✅
- `user+tag@domain.com` ✅

**Example Invalid Emails:**
- `notanemail` ❌
- `@domain.com` ❌
- `user@` ❌
- `user@domain` ❌

---

### Password Validation
```javascript
body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
```

**Rules:**
- ✅ Minimum length: **8 characters**
- ✅ Must contain at least **1 uppercase letter** (A-Z)
- ✅ Must contain at least **1 lowercase letter** (a-z)
- ✅ Must contain at least **1 number** (0-9)
- ✅ Must contain at least **1 special character** from: `@ $ ! % * ? &`
- ❌ Fails if any rule is not met

**Example Valid Passwords:**
- `Password123!` ✅
- `MyPass@2024` ✅
- `Secure$Pass1` ✅
- `Test123!Pass` ✅

**Example Invalid Passwords:**
- `password` ❌ (no uppercase, no number, no special char)
- `PASSWORD123!` ❌ (no lowercase)
- `Password!` ❌ (no number)
- `Password123` ❌ (no special character)
- `Pass1!` ❌ (too short, less than 8 characters)

---

### First Name Validation
```javascript
body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
```

**Rules:**
- ✅ Minimum length: **2 characters**
- ✅ Maximum length: **50 characters**
- ✅ Automatically trimmed (whitespace removed)
- ❌ Fails if length is less than 2 or greater than 50

**Example Valid First Names:**
- `John` ✅
- `Mary` ✅
- `Jean-Pierre` ✅

**Example Invalid First Names:**
- `J` ❌ (too short, less than 2 characters)
- `A` ❌ (too short)
- `ThisIsAVeryLongFirstNameThatExceedsFiftyCharactersInLength` ❌ (too long)

---

### Last Name Validation
```javascript
body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
```

**Rules:**
- ✅ Minimum length: **2 characters**
- ✅ Maximum length: **50 characters**
- ✅ Automatically trimmed (whitespace removed)
- ❌ Fails if length is less than 2 or greater than 50

**Example Valid Last Names:**
- `Doe` ✅
- `Smith` ✅
- `O'Brien` ✅

**Example Invalid Last Names:**
- `D` ❌ (too short)
- `ThisIsAVeryLongLastNameThatExceedsFiftyCharactersInLength` ❌ (too long)

---

### Role Validation
```javascript
body('role')
    .optional()
    .isIn(['admin', 'user', 'moderator'])
    .withMessage('Invalid role specified')
```

**Rules:**
- ✅ **Optional** field (can be omitted)
- ✅ If provided, must be one of: `admin`, `user`, `moderator`
- ✅ Defaults to `'user'` if not provided
- ❌ Fails if value is not in allowed list

**Example Valid Roles:**
- `admin` ✅
- `user` ✅
- `moderator` ✅
- (omitted - defaults to `user`) ✅

**Example Invalid Roles:**
- `administrator` ❌ (not in allowed list)
- `guest` ❌ (not in allowed list)
- `Admin` ❌ (case-sensitive, must be lowercase)

---

## 🔒 2. Password Reset Validation Rules

**Endpoint:** `POST /api/auth/password-reset`

**Controller:** `controllers/passwordController.js`  
**Validation Array:** `passwordResetValidation`

### Email Validation (Password Reset Request)
```javascript
body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
```

**Rules:**
- ✅ Same as sign-up email validation
- ✅ Must be a valid email format
- ✅ Email is normalized

---

## 🔑 3. New Password Validation Rules

**Used for:** Password reset, password change

**Controller:** `controllers/passwordController.js`  
**Validation Array:** `newPasswordValidation`

### Password Validation
```javascript
body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
```

**Rules:**
- ✅ **Same validation as sign-up password**
- ✅ Minimum length: **8 characters**
- ✅ Must contain uppercase, lowercase, number, and special character
- ✅ Used for:
  - Password reset (`POST /api/auth/reset-password`)
  - Change password (`POST /api/auth/change-password`)

---

## 📝 4. Profile Update Validation Rules

**Endpoints:**
- `PUT /api/my-profile` - Update own profile
- `PUT /api/user-management/users/:userId/profile` - Update user profile (admin)

**Controllers:**
- `controllers/myProfileController.js`
- `controllers/userManagementController.js`

### ⚠️ Important: No Explicit Validation Rules

**Current Implementation:**
- Profile updates **do NOT have explicit validation rules** in the controllers
- Fields are accepted as-is if provided
- No length, format, or type validation is performed
- All fields are optional

### Profile Fields (No Validation):
- `first_name` - String (no validation)
- `last_name` - String (no validation)
- `phone` - String (no validation)
- `date_of_birth` - String/Date (no validation)
- `address` - String (no validation)
- `city` - String (no validation)
- `state` - String (no validation)
- `country` - String (no validation)
- `postal_code` - String (no validation)
- `avatar_url` - String/URL (no validation)
- `bio` - String/Text (no validation)
- `website` - String/URL (no validation)

### 📌 Recommendation: Add Validation Rules

To improve data quality, consider adding validation for profile updates:

```javascript
const profileUpdateValidation = [
    body('first_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Phone number format is invalid'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    body('postal_code')
        .optional()
        .isLength({ min: 4, max: 10 })
        .withMessage('Postal code must be between 4 and 10 characters'),
    body('avatar_url')
        .optional()
        .isURL()
        .withMessage('Avatar URL must be a valid URL'),
    body('website')
        .optional()
        .isURL()
        .withMessage('Website URL must be a valid URL'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters')
];
```

---

## 📊 Validation Summary Table

| Field | Sign Up | Password Reset | Profile Update | Rules |
|-------|---------|----------------|----------------|-------|
| **email** | ✅ Required | ✅ Required | ⚠️ Not validated | Valid email format, normalized |
| **password** | ✅ Required | ✅ Required (new password) | ❌ N/A | Min 8 chars, uppercase, lowercase, number, special char |
| **firstName** | ✅ Required | ❌ N/A | ⚠️ Not validated | 2-50 characters, trimmed |
| **lastName** | ✅ Required | ❌ N/A | ⚠️ Not validated | 2-50 characters, trimmed |
| **role** | ✅ Optional | ❌ N/A | ❌ N/A | Must be: admin, user, moderator |
| **phone** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **date_of_birth** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **address** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **city** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **state** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **country** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **postal_code** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **avatar_url** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **bio** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |
| **website** | ❌ N/A | ❌ N/A | ⚠️ Not validated | No validation |

---

## 🚨 Validation Error Response Format

When validation fails, the API returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 8 characters long",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "First name must be between 2 and 50 characters",
      "param": "firstName",
      "location": "body"
    }
  ]
}
```

**HTTP Status Code:** `400 Bad Request`

---

## ✅ Example Valid Sign Up Request

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "john.doe@example.com",
    "verificationRequired": true
  }
}
```

---

## ❌ Example Invalid Sign Up Request

```json
{
  "email": "invalid-email",
  "password": "weak",
  "firstName": "J",
  "lastName": "D",
  "role": "invalid_role"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Please provide a valid email address",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 8 characters long",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "First name must be between 2 and 50 characters",
      "param": "firstName",
      "location": "body"
    },
    {
      "msg": "Last name must be between 2 and 50 characters",
      "param": "lastName",
      "location": "body"
    },
    {
      "msg": "Invalid role specified",
      "param": "role",
      "location": "body"
    }
  ]
}
```

---

## 🔍 Testing Validation Rules

### Test Sign Up Validation
```bash
# Valid request
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!Pass",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Invalid request (will show all validation errors)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-App-Id: default_app_id" \
  -H "X-Service-Key: default_service_key" \
  -d '{
    "email": "invalid",
    "password": "weak",
    "firstName": "A",
    "lastName": "B"
  }'
```

---

## 📌 Recommendations

1. **Add Profile Update Validation:**
   - Implement validation rules for profile updates
   - Validate phone numbers, URLs, dates, etc.
   - Prevent invalid data from being stored

2. **Email Format Validation:**
   - Already implemented ✅
   - Consider additional checks (domain validation, disposable email detection)

3. **Password Strength:**
   - Current rules are good ✅
   - Consider adding password complexity scoring

4. **Name Validation:**
   - Current rules are adequate ✅
   - Consider special character handling for international names

5. **Phone Number Validation:**
   - Not currently validated ⚠️
   - Add format validation for international phone numbers

6. **Date Validation:**
   - Not currently validated ⚠️
   - Add ISO8601 date format validation

7. **URL Validation:**
   - Not currently validated ⚠️
   - Add URL format validation for avatar_url and website

---

## 📚 Additional Resources

- **Express-Validator Documentation:** https://express-validator.github.io/docs/
- **Validation Middleware:** `express-validator`
- **Controller Files:**
  - `controllers/authController.js` - Sign up validation
  - `controllers/passwordController.js` - Password validation
  - `controllers/myProfileController.js` - Profile updates (no validation)
  - `controllers/userManagementController.js` - User management (no validation)

---

**Last Updated:** 2024  
**Version:** 1.0

