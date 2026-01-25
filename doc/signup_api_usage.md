# Signup API Documentation

## Endpoint Overview
- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Authentication Headers
This endpoint requires special application credentials to prevent unauthorized usage from outside the frontend application.

| Header | Value Source | Description |
|--------|--------------|-------------|
| `x-app-id` | `process.env.APP_ID` | The unique ID for your application. |
| `x-service-key` | `process.env.SERVICE_KEY` | The secret key for your application service. |

> **Note**: These values are configured in your backend `.env` file (or `config/config.js`). Ensure your frontend sends these headers with every signup request.

## Request Body
The request body must be a JSON object with the following fields:

| Field | Type | Required | Validation Rules | Description |
|-------|------|----------|------------------|-------------|
| `email` | String | Yes | Must be a valid email format. | The user's email address. |
| `password` | String | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char. | The user's password. |
| `firstName` | String | Yes | 2-50 characters. | The user's first name. |
| `lastName` | String | Yes | 2-50 characters. | The user's last name. |
| `secretCode` | String | Yes | Must match the active `signup_secret_code` in `secret_tbl`. | A security code required to allow registration. |

**Important**: 
- **Do not send a `role` field**: The backend strictly ignores any `role` sent in the signup body. All new users are automatically assigned the `user` role for security.
- Any extra fields included in the request body (e.g., `phoneNumber`, `address`) will be stored in the `custom_fields` JSON column in the `profiles` table.

## Frontend Implementation Guidelines

### 1. Handling User Roles
> **User Question**: "Forcing signup role to 'user' - how to correct this in frontend?"

**The Correction**: 
You do not need to change the backend. The correct frontend implementation is to **REMOVE** the `role` field from your signup form's data payload.
- The signup endpoint `/api/auth/signup` is **strictly for creating standard 'user' accounts**.
- **Admin/Staff Creation**: If you need to create 'admin' or 'staff' accounts, you must:
    1.  Create the user as a standard 'user' first.
    2.  Log in as an existing Admin.
    3.  Use the User Management API (`/api/user-management/users/:userId`) to update their role to 'admin' manually.

### 2. Request Example (Correct Handling)
```javascript
// Valid Signup Payload
const signupData = {
  email: "jane.doe@example.com",
  password: "StrongPassword123!",
  firstName: "Jane",
  lastName: "Doe",
  secretCode: "CONNEX2024" // Matches default backend secret
  // NO 'role' field here!
};

// Send to backend
await axios.post('/api/auth/signup', signupData, {
  headers: {
    'x-app-id': process.env.REACT_APP_APP_ID,
    'x-service-key': process.env.REACT_APP_SERVICE_KEY
  }
});
```

## Responses

### Success (201 Created)
Returns when the account is successfully created. The user must verify their email next.
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 15,
    "email": "jane.doe@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

### Validation Error (400 Bad Request)
Returns when input fields fail validation.
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "weak",
      "msg": "Password must be at least 8 characters long",
      "path": "password",
      "location": "body"
    }
  ]
}
```

### Invalid Secret Code (403 Forbidden)
Returns when the `secretCode` does not match the one in the database.
```json
{
  "success": false,
  "message": "Invalid secret code provided"
}
```

### Email Already Exists (409 Conflict)
Returns when the provided email is already registered.
```json
{
  "success": false,
  "message": "Email address already registered"
}
```

## Implementation Notes for Frontend
1.  **Headers**: Make sure your API client (e.g., Axios, Fetch) includes the `x-app-id` and `x-service-key` headers.
2.  **Secret Code**: You need to decide how the `secretCode` is handled. Is it a public code shared with users, or is it fetched from an endpoint? Based on the backend logic, it's a fixed code stored in the database, intended to restrict who can sign up (e.g., for a private beta or specific user group).
3.  **Password Strength**: Implement client-side validation that matches the backend rules (Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special) to provide immediate feedback.
4.  **Email Verification**: The response indicates `verificationRequired: true`. You should redirect the user to a page telling them to check their email for a verification link.
