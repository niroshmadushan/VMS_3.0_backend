# Frontend API Integration Guide

## 🔐 Backend Security Configuration

Your backend now implements **strict origin control**. Only requests from these origins are allowed:

- ✅ `http://localhost:6001` (your frontend)
- ✅ `http://localhost:3000` (backend internal requests)
- ❌ All other origins are blocked and logged

### Required Headers for ALL API Requests

```javascript
const API_HEADERS = {
  'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
  'x-service-key': 'dfsdsda345Bdchvbjhbh456',
  'Origin': 'http://localhost:6001'  // Must match your frontend URL
};
```

**⚠️ Important:** Always set the `Origin` header to `http://localhost:6001` when making requests from your frontend.

## 🚀 API Endpoints

### Base URL
```
http://localhost:3000/api
```

---

## 📝 Authentication Endpoints

### 1. User Registration (Signup)
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "John",
  "lastName": "Doe",
  "secretCode": "CONNEX2024"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "role": "user",
    "verificationRequired": true
  }
}
```

**Error Responses:**
- `400`: Validation errors (missing fields, weak password, etc.)
- `403`: Invalid secret code
- `409`: Email already exists

---

### 2. User Login
**Endpoint:** `POST /api/auth/login`

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

---

### 3. OTP Verification (Complete Login)
**Endpoint:** `POST /api/auth/verify-otp`

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
      "token": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresAt": "2026-01-22T10:00:00.000Z"
    }
  }
}
```

---

### 4. Email Verification
**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "email_verification_token_from_email"
}
```

---

### 5. Resend Verification Email
**Endpoint:** `POST /api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

## 🔧 JavaScript/TypeScript Integration Examples

### Custom Auth Hook (TypeScript)

```typescript
// custom-auth.ts
const API_BASE_URL = 'http://localhost:3000/api';
const API_HEADERS = {
  'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
  'x-service-key': 'dfsdsda345Bdchvbjhbh456',
  'Origin': 'http://localhost:6001'
};

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoginResponse extends AuthResponse {
  data?: {
    email: string;
    otpRequired: boolean;
  };
}

export interface SignupResponse extends AuthResponse {
  data?: {
    userId: number;
    email: string;
    role: string;
    verificationRequired: boolean;
  };
}

class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...API_HEADERS,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'API request failed',
      response.status,
      data
    );
  }

  return data;
}

export const authApi = {
  // Signup function
  async signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretCode: string;
  }): Promise<SignupResponse> {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login function
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // OTP verification function
  async verifyOtp(data: {
    email: string;
    otpCode: string;
  }): Promise<any> {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Email verification
  async verifyEmail(token: string): Promise<any> {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};
```

### React Hook Example

```typescript
// useAuth.ts
import { useState, useContext, createContext, ReactNode } from 'react';
import { authApi, AuthResponse, SignupResponse, LoginResponse } from './custom-auth';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretCode: string;
  }) => Promise<SignupResponse>;
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  verifyOtp: (data: { email: string; otpCode: string }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signup = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretCode: string;
  }): Promise<SignupResponse> => {
    setLoading(true);
    try {
      const response = await authApi.signup(userData);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (data: {
    email: string;
    otpCode: string;
  }): Promise<any> => {
    setLoading(true);
    try {
      const response = await authApi.verifyOtp(data);

      // Store user session data
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        // Store tokens in localStorage or secure storage
        localStorage.setItem('authToken', response.data.session.token);
        localStorage.setItem('refreshToken', response.data.session.refreshToken);
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Login Form Component Example

```tsx
// LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';

export function LoginForm() {
  const { login, verifyOtp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await login({ email, password });

      if (response.success && response.data?.otpRequired) {
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await verifyOtp({ email, otpCode });

      if (response.success) {
        // Redirect to dashboard or home page
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    }
  };

  if (step === 'login') {
    return (
      <form onSubmit={handleLoginSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOtpSubmit}>
      <div>
        <p>Enter the 6-digit code sent to {email}</p>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          required
        />
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>

      <button type="button" onClick={() => setStep('login')}>
        Back to Login
      </button>
    </form>
  );
}
```

### Signup Form Component Example

```tsx
// SignupForm.tsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';

export function SignupForm() {
  const { signup, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    secretCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await signup(formData);

      if (response.success) {
        setSuccess('Account created successfully! Please check your email for verification.');
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          secretCode: ''
        });
      }
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Signup failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name:</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Last Name:</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
        />
      </div>

      <div>
        <label>Secret Code:</label>
        <input
          type="password"
          name="secretCode"
          value={formData.secretCode}
          onChange={handleChange}
          placeholder="Enter signup secret code"
          required
        />
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

---

## ⚠️ Important Notes

### Endpoint Corrections
- **WRONG:** `/api/auth/secure-signup` ❌
- **CORRECT:** `/api/auth/signup` ✅

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Secret Code
- Required for all signups
- Current code: `CONNEX2024`
- Keep this secret and rotate periodically

### Error Handling
Always wrap API calls in try-catch blocks and handle different error types:

```typescript
try {
  const response = await authApi.signup(userData);
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors (400, 403, 409, etc.)
    console.error('API Error:', error.status, error.message);
  } else {
    // Handle network errors
    console.error('Network Error:', error.message);
  }
}
```

---

## 🔧 Development Tips

1. **Test Endpoints:** Use the health endpoint first: `GET /health`
2. **Check Logs:** Backend logs will show allowed/blocked requests
3. **CORS Issues:** Ensure Origin header is set to `http://localhost:6001`
4. **Rate Limiting:** Auth endpoints have rate limits - avoid spam testing

---

## 📞 Support

If you encounter issues:
1. Check browser developer tools for CORS errors
2. Verify all required headers are included
3. Check backend logs for security middleware messages
4. Ensure you're using the correct endpoints and request format
