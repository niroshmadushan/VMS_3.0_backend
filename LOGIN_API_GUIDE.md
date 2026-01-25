# 🔐 Login API Integration Guide

## 📋 Overview

The login process is a **two-step authentication**:
1. **Step 1:** Submit email/password → Receive OTP via email
2. **Step 2:** Submit email/OTP code → Receive JWT tokens

## 🚀 API Endpoints

**Base URL:** `http://localhost:3000/api`

---

## 1️⃣ Step 1: Initial Login Request

**Endpoint:** `POST /auth/login`

**Required Headers:**
```javascript
const headers = {
  'Content-Type': 'application/json',
  'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
  'x-service-key': 'dfsdsda345Bdchvbjhbh456',
  'Origin': 'http://localhost:6001'  // Your frontend origin
};
```

**🔒 Security Note:** Only requests from `localhost:6001` (frontend) and `localhost:3000` (backend) are allowed. All other origins will be blocked.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success Response (200):**
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

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account not verified (check email)
- `423`: Account temporarily locked (too many failed attempts)
- `429`: Too many login attempts (rate limited)

---

## 2️⃣ Step 2: OTP Verification (Complete Login)

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Success Response (200):**
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
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2026-01-22T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Missing email or OTP code
- `400`: Invalid or expired OTP code

---

## 💻 Implementation Examples

### JavaScript/TypeScript Login Function

```typescript
// login-api.ts
const API_BASE_URL = 'http://localhost:3000/api';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
  'x-service-key': 'dfsdsda345Bdchvbjhbh456',
  'Origin': 'http://localhost:6001'
};

export interface LoginStep1Response {
  success: boolean;
  message: string;
  data?: {
    email: string;
    otpRequired: boolean;
  };
}

export interface LoginStep2Response {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    session: {
      token: string;
      refreshToken: string;
      expiresAt: string;
    };
  };
}

export class LoginApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'LoginApiError';
  }
}

// Step 1: Initial login (sends OTP)
export async function loginStep1(credentials: {
  email: string;
  password: string;
}): Promise<LoginStep1Response> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new LoginApiError(
      data.message || 'Login failed',
      response.status,
      data
    );
  }

  return data;
}

// Step 2: OTP verification (completes login)
export async function loginStep2(otpData: {
  email: string;
  otpCode: string;
}): Promise<LoginStep2Response> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(otpData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new LoginApiError(
      data.message || 'OTP verification failed',
      response.status,
      data
    );
  }

  return data;
}
```

### React Login Hook

```typescript
// useLogin.ts
import { useState } from 'react';
import { loginStep1, loginStep2, LoginApiError } from './login-api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Session {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

interface LoginState {
  step: 'credentials' | 'otp';
  loading: boolean;
  error: string | null;
  user: User | null;
  session: Session | null;
}

export function useLogin() {
  const [state, setState] = useState<LoginState>({
    step: 'credentials',
    loading: false,
    error: null,
    user: null,
    session: null,
  });

  const loginWithCredentials = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await loginStep1({ email, password });

      if (response.success && response.data?.otpRequired) {
        setState(prev => ({
          ...prev,
          step: 'otp',
          loading: false
        }));
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error instanceof LoginApiError
        ? error.message
        : 'Login failed';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (email: string, otpCode: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await loginStep2({ email, otpCode });

      if (response.success && response.data) {
        // Store tokens
        localStorage.setItem('authToken', response.data.session.token);
        localStorage.setItem('refreshToken', response.data.session.refreshToken);

        setState(prev => ({
          ...prev,
          step: 'credentials',
          loading: false,
          user: response.data!.user,
          session: response.data!.session,
          error: null
        }));

        return { success: true, user: response.data.user };
      }
    } catch (error) {
      const errorMessage = error instanceof LoginApiError
        ? error.message
        : 'OTP verification failed';

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      return { success: false, error: errorMessage };
    }
  };

  const resetLogin = () => {
    setState({
      step: 'credentials',
      loading: false,
      error: null,
      user: null,
      session: null,
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    resetLogin();
  };

  return {
    // State
    step: state.step,
    loading: state.loading,
    error: state.error,
    user: state.user,
    session: state.session,
    isLoggedIn: !!state.user,

    // Actions
    loginWithCredentials,
    verifyOtp,
    resetLogin,
    logout,
  };
}
```

### React Login Component

```tsx
// LoginForm.tsx
import React, { useState } from 'react';
import { useLogin } from './useLogin';

export function LoginForm() {
  const { step, loading, error, loginWithCredentials, verifyOtp, resetLogin } = useLogin();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [otpCode, setOtpCode] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await loginWithCredentials(credentials.email, credentials.password);

    if (result.success) {
      // Move to OTP step automatically
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await verifyOtp(credentials.email, otpCode);

    if (result.success) {
      // Redirect to dashboard or home
      window.location.href = '/dashboard';
    }
  };

  const handleBackToLogin = () => {
    setOtpCode('');
    resetLogin();
  };

  if (step === 'otp') {
    return (
      <div className="login-form">
        <h2>Enter Verification Code</h2>
        <p>We've sent a 6-digit code to {credentials.email}</p>

        <form onSubmit={handleOtpSubmit}>
          <div className="form-group">
            <label htmlFor="otp">Verification Code:</label>
            <input
              id="otp"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || otpCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button type="button" onClick={handleBackToLogin} className="secondary">
            Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h2>Login to Your Account</h2>

      <form onSubmit={handleCredentialsSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Sending Code...' : 'Send Verification Code'}
        </button>
      </form>
    </div>
  );
}
```

### Plain JavaScript Example

```javascript
// login.js
const API_BASE_URL = 'http://localhost:3000/api';

const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
  'x-service-key': 'dfsdsda345Bdchvbjhbh456',
  'Origin': 'http://localhost:6001'
};

// Step 1: Login with credentials
async function loginWithCredentials(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Step 2: Verify OTP
async function verifyOtp(email, otpCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ email, otpCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    // Store tokens
    if (data.success && data.data?.session) {
      localStorage.setItem('authToken', data.data.session.token);
      localStorage.setItem('refreshToken', data.data.session.refreshToken);
    }

    return data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
}

// Usage example
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    // Step 1: Get OTP
    const loginResult = await loginWithCredentials(email, password);
    console.log('OTP sent:', loginResult.message);

    // Show OTP input form
    showOtpForm(email);

  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

async function handleOtpVerification(email) {
  const otpCode = document.getElementById('otp').value;

  try {
    // Step 2: Verify OTP
    const result = await verifyOtp(email, otpCode);
    console.log('Login successful:', result.message);

    // Redirect to dashboard
    window.location.href = '/dashboard';

  } catch (error) {
    alert('OTP verification failed: ' + error.message);
  }
}

function showOtpForm(email) {
  // Hide login form and show OTP form
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('otpForm').style.display = 'block';
  document.getElementById('otpEmail').textContent = email;
}
```

---

## ⚠️ Error Handling

### Common Error Scenarios:

1. **Invalid Credentials (401):**
   ```json
   {
     "success": false,
     "message": "Invalid credentials"
   }
   ```

2. **Account Not Verified (403):**
   ```json
   {
     "success": false,
     "message": "Please verify your email address before logging in",
     "canResendVerification": true,
     "email": "user@example.com"
   }
   ```

3. **Account Locked (423):**
   ```json
   {
     "success": false,
     "message": "Account is temporarily locked due to too many failed attempts"
   }
   ```

4. **Rate Limited (429):**
   ```json
   {
     "success": false,
     "message": "Too many authentication attempts, please try again later"
   }
   ```

5. **Invalid OTP (400):**
   ```json
   {
     "success": false,
     "message": "Invalid or expired OTP code"
   }
   ```

---

## 🔧 Token Management

### Storing Tokens:
```javascript
// After successful OTP verification
localStorage.setItem('authToken', response.data.session.token);
localStorage.setItem('refreshToken', response.data.session.refreshToken);
```

### Using Tokens for Authenticated Requests:
```javascript
const authHeaders = {
  ...API_HEADERS,
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
};
```

### Token Expiration:
- Access tokens expire in 24 hours
- Refresh tokens expire in 7 days
- Implement automatic token refresh for better UX

---

## 📱 Mobile/App Integration

For mobile apps, the same API endpoints work but you might need to:

1. **Remove Origin header** (not needed for mobile apps)
2. **Use device-specific user agents**
3. **Implement push notifications** instead of email OTP
4. **Handle offline scenarios**

---

## 🧪 Testing the Login Flow

### Test User Creation:
```bash
# First create a test user via signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "x-service-key: dfsdsda345Bdchvbjhbh456" \
  -H "Origin: http://localhost:6001" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "secretCode": "CONNEX2024"
  }'
```

### Test Login Flow:
```bash
# Step 1: Login (check email for OTP)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "x-service-key: dfsdsda345Bdchvbjhbh456" \
  -H "Origin: http://localhost:6001" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'

# Step 2: Verify OTP (use code from email)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "x-app-id: uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123" \
  -H "x-service-key: dfsdsda345Bdchvbjhbh456" \
  -H "Origin: http://localhost:6001" \
  -d '{"email": "test@example.com", "otpCode": "123456"}'
```

---

## 🚨 Security Notes

- **Always use HTTPS** in production
- **Store tokens securely** (localStorage is ok for web, but use secure storage for mobile)
- **Implement token refresh** before expiration
- **Clear tokens on logout**
- **Validate tokens on protected routes**

---

## 📞 Need Help?

If you encounter issues:
1. Check browser network tab for CORS errors
2. Verify all headers are included correctly
3. Check email for OTP codes
4. Ensure account is verified before login
5. Check backend logs for security middleware messages
