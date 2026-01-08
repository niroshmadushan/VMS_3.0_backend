# 🎨 Secure Signup API - Frontend Integration Guide

Complete guide for integrating the Secure Signup API into your frontend application.

---

## 📋 **Table of Contents**

1. [Quick Start](#quick-start)
2. [API Endpoint](#api-endpoint)
3. [Vanilla JavaScript Example](#vanilla-javascript-example)
4. [React Example](#react-example)
5. [Vue.js Example](#vuejs-example)
6. [Angular Example](#angular-example)
7. [Form Validation](#form-validation)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Complete Example](#complete-example)

---

## 🚀 **Quick Start**

### **Option 1: Using the Utility Class (Recommended)**

```html
<!-- Include the utility class -->
<script src="/frontend/SecureSignupAPI.js"></script>

<script>
  // Initialize
  const signupAPI = new SecureSignupAPI({
    baseURL: 'http://localhost:3000',
    appId: 'your_app_id',
    serviceKey: 'your_service_key'
  });

  // Use it
  const result = await signupAPI.signup({
    email: 'user@connexit.biz',
    password: 'SecurePass123!@#',
    firstName: 'John',
    lastName: 'Doe',
    secretCode: 'CONNEX2024',
    role: 'user'
  });

  if (result.success) {
    console.log('Signup successful!', result.data);
  } else {
    console.error('Signup failed:', result.message, result.errors);
  }
</script>
```

### **Option 2: Direct Fetch API**

```javascript
const signupData = {
  email: 'user@connexit.biz',
  password: 'SecurePass123!@#',
  firstName: 'John',
  lastName: 'Doe',
  secretCode: 'CONNEX2024',
  role: 'user'
};

const response = await fetch('http://localhost:3000/api/auth/secure-signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'your_app_id',
    'X-Service-Key': 'your_service_key'
  },
  body: JSON.stringify(signupData)
});

const result = await response.json();
```

---

## 📡 **API Endpoint**

**URL:** `POST http://localhost:3000/api/auth/secure-signup`

**Required Headers:**
- `Content-Type: application/json`
- `X-App-ID: your_app_id`
- `X-Service-Key: your_service_key`

---

## 📦 **Using the Utility Class**

### **Simple Example**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Secure Signup</title>
    <script src="/frontend/SecureSignupAPI.js"></script>
</head>
<body>
    <form id="signupForm">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <input type="text" id="firstName" placeholder="First Name" required>
        <input type="text" id="lastName" placeholder="Last Name" required>
        <input type="text" id="secretCode" placeholder="Secret Code" required>
        <button type="submit">Sign Up</button>
    </form>

    <script>
        const signupAPI = new SecureSignupAPI({
            baseURL: 'http://localhost:3000',
            appId: 'your_app_id',
            serviceKey: 'your_service_key'
        });

        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                secretCode: document.getElementById('secretCode').value
            };

            // Validate before submitting
            const validation = signupAPI.validateForm(formData);
            if (!validation.valid) {
                console.error('Validation errors:', validation.errors);
                // Display errors to user
                return;
            }

            // Submit
            const result = await signupAPI.signup(formData);
            
            if (result.success) {
                alert('Signup successful! Check your email for verification.');
                // Redirect to verification page
            } else {
                console.error('Signup failed:', result.message, result.errors);
                // Display errors to user
            }
        });
    </script>
</body>
</html>
```

### **Utility Class Methods**

```javascript
const signupAPI = new SecureSignupAPI(config);

// Validate email domain
const emailCheck = signupAPI.validateEmailDomain('user@connexit.biz');
// Returns: { valid: true } or { valid: false, message: '...' }

// Validate password
const passwordCheck = signupAPI.validatePassword('SecurePass123!@#');
// Returns: { valid: true } or { valid: false, message: '...' }

// Check password strength (for UI)
const strength = signupAPI.checkPasswordStrength('SecurePass123!@#');
// Returns: { strength: 5, checks: {...}, isValid: true }

// Validate entire form
const validation = signupAPI.validateForm(formData);
// Returns: { valid: true/false, errors: {...} }

// Get allowed domains
const domains = signupAPI.getAllowedDomains();
// Returns: ['connexit.biz', 'connexcodeworks.biz', ...]

// Signup
const result = await signupAPI.signup(formData);
// Returns: { success: true/false, data: {...}, errors: {...} }
```

---

## 💻 **Vanilla JavaScript Example**

### **Complete HTML Form Example**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Signup</title>
    <style>
        .form-container {
            max-width: 500px;
            margin: 50px auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .error {
            color: red;
            font-size: 14px;
            margin-top: 5px;
        }
        .success {
            color: green;
            font-size: 14px;
            margin-top: 5px;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Secure Signup</h2>
        <form id="signupForm">
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required>
                <small class="error" id="emailError"></small>
            </div>

            <div class="form-group">
                <label for="password">Password *</label>
                <input type="password" id="password" name="password" required>
                <small class="error" id="passwordError"></small>
                <small style="color: #666;">Min 12 chars: uppercase, lowercase, number, special char</small>
            </div>

            <div class="form-group">
                <label for="firstName">First Name *</label>
                <input type="text" id="firstName" name="firstName" required>
                <small class="error" id="firstNameError"></small>
            </div>

            <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input type="text" id="lastName" name="lastName" required>
                <small class="error" id="lastNameError"></small>
            </div>

            <div class="form-group">
                <label for="secretCode">Secret Code *</label>
                <input type="text" id="secretCode" name="secretCode" required>
                <small class="error" id="secretCodeError"></small>
            </div>

            <div class="form-group">
                <label for="role">Role</label>
                <select id="role" name="role">
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="assistant">Assistant</option>
                </select>
            </div>

            <button type="submit" id="submitBtn">Sign Up</button>
            <div id="message"></div>
        </form>
    </div>

    <script>
        // Configuration - Get these from your environment/config
        const API_CONFIG = {
            baseURL: 'http://localhost:3000',
            appId: 'your_app_id', // Get from config
            serviceKey: 'your_service_key' // Get from config
        };

        // Allowed email domains
        const ALLOWED_DOMAINS = [
            'connexit.biz',
            'connexcodeworks.biz',
            'conex360.biz',
            'connexvectra.biz'
        ];

        // Form validation
        function validateForm() {
            let isValid = true;
            const errors = {};

            // Clear previous errors
            document.querySelectorAll('.error').forEach(el => el.textContent = '');

            // Email validation
            const email = document.getElementById('email').value.trim();
            if (!email) {
                errors.email = 'Email is required';
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.email = 'Invalid email format';
                isValid = false;
            } else {
                const domain = email.split('@')[1]?.toLowerCase();
                if (!ALLOWED_DOMAINS.includes(domain)) {
                    errors.email = `Email must be from: ${ALLOWED_DOMAINS.join(', ')}`;
                    isValid = false;
                }
            }

            // Password validation
            const password = document.getElementById('password').value;
            if (!password) {
                errors.password = 'Password is required';
                isValid = false;
            } else if (password.length < 12) {
                errors.password = 'Password must be at least 12 characters';
                isValid = false;
            } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])/.test(password)) {
                errors.password = 'Password must contain uppercase, lowercase, number, and special character';
                isValid = false;
            }

            // First name validation
            const firstName = document.getElementById('firstName').value.trim();
            if (!firstName) {
                errors.firstName = 'First name is required';
                isValid = false;
            } else if (firstName.length < 2 || firstName.length > 50) {
                errors.firstName = 'First name must be between 2 and 50 characters';
                isValid = false;
            } else if (!/^[a-zA-Z\s'-]+$/.test(firstName)) {
                errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes';
                isValid = false;
            }

            // Last name validation
            const lastName = document.getElementById('lastName').value.trim();
            if (!lastName) {
                errors.lastName = 'Last name is required';
                isValid = false;
            } else if (lastName.length < 2 || lastName.length > 50) {
                errors.lastName = 'Last name must be between 2 and 50 characters';
                isValid = false;
            } else if (!/^[a-zA-Z\s'-]+$/.test(lastName)) {
                errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
                isValid = false;
            }

            // Secret code validation
            const secretCode = document.getElementById('secretCode').value.trim();
            if (!secretCode) {
                errors.secretCode = 'Secret code is required';
                isValid = false;
            } else if (secretCode.length < 5 || secretCode.length > 100) {
                errors.secretCode = 'Secret code must be between 5 and 100 characters';
                isValid = false;
            }

            // Display errors
            Object.keys(errors).forEach(field => {
                const errorEl = document.getElementById(field + 'Error');
                if (errorEl) {
                    errorEl.textContent = errors[field];
                }
            });

            return isValid;
        }

        // Handle form submission
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous messages
            document.getElementById('message').innerHTML = '';

            // Validate form
            if (!validateForm()) {
                return;
            }

            // Disable submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing up...';

            // Prepare data
            const formData = {
                email: document.getElementById('email').value.trim().toLowerCase(),
                password: document.getElementById('password').value,
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                secretCode: document.getElementById('secretCode').value.trim().toUpperCase(),
                role: document.getElementById('role').value || 'user'
            };

            try {
                const response = await fetch(`${API_CONFIG.baseURL}/api/auth/secure-signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-ID': API_CONFIG.appId,
                        'X-Service-Key': API_CONFIG.serviceKey
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Success
                    document.getElementById('message').innerHTML = `
                        <div class="success">
                            ✅ ${data.message}<br>
                            Please check your email (${data.data.email}) for verification.
                        </div>
                    `;
                    
                    // Reset form
                    document.getElementById('signupForm').reset();
                    
                    // Redirect to verification page or show success message
                    setTimeout(() => {
                        window.location.href = '/verify-email?email=' + encodeURIComponent(data.data.email);
                    }, 2000);
                } else {
                    // Handle errors
                    let errorMessage = data.message || 'Signup failed';
                    
                    // Display validation errors
                    if (data.errors && Array.isArray(data.errors)) {
                        data.errors.forEach(error => {
                            const field = error.field || error.param;
                            const errorEl = document.getElementById(field + 'Error');
                            if (errorEl) {
                                errorEl.textContent = error.message || error.msg;
                            }
                        });
                        errorMessage = 'Please fix the errors above';
                    }
                    
                    document.getElementById('message').innerHTML = `
                        <div class="error">❌ ${errorMessage}</div>
                    `;
                }
            } catch (error) {
                console.error('Signup error:', error);
                document.getElementById('message').innerHTML = `
                    <div class="error">❌ Network error. Please try again.</div>
                `;
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    </script>
</body>
</html>
```

---

## ⚛️ **React Example**

### **React Component with Hooks**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const SecureSignup = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        secretCode: '',
        role: 'user'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // API Configuration
    const API_CONFIG = {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
        appId: process.env.REACT_APP_APP_ID || 'your_app_id',
        serviceKey: process.env.REACT_APP_SERVICE_KEY || 'your_service_key'
    };

    const ALLOWED_DOMAINS = [
        'connexit.biz',
        'connexcodeworks.biz',
        'conex360.biz',
        'connexvectra.biz'
    ];

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else {
            const domain = formData.email.split('@')[1]?.toLowerCase();
            if (!ALLOWED_DOMAINS.includes(domain)) {
                newErrors.email = `Email must be from: ${ALLOWED_DOMAINS.join(', ')}`;
            }
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 12) {
            newErrors.password = 'Password must be at least 12 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
        }

        // First name validation
        if (!formData.firstName || formData.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }

        // Last name validation
        if (!formData.lastName || formData.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }

        // Secret code validation
        if (!formData.secretCode || formData.secretCode.trim().length < 5) {
            newErrors.secretCode = 'Secret code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_CONFIG.baseURL}/api/auth/secure-signup`,
                {
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    secretCode: formData.secretCode.trim().toUpperCase(),
                    role: formData.role
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-ID': API_CONFIG.appId,
                        'X-Service-Key': API_CONFIG.serviceKey
                    }
                }
            );

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: response.data.message
                });
                // Reset form
                setFormData({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    secretCode: '',
                    role: 'user'
                });
                // Redirect to verification page
                setTimeout(() => {
                    window.location.href = `/verify-email?email=${encodeURIComponent(response.data.data.email)}`;
                }, 2000);
            }
        } catch (error) {
            if (error.response) {
                const errorData = error.response.data;
                
                // Handle validation errors
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const validationErrors = {};
                    errorData.errors.forEach(err => {
                        const field = err.field || err.param;
                        validationErrors[field] = err.message || err.msg;
                    });
                    setErrors(validationErrors);
                }
                
                setMessage({
                    type: 'error',
                    text: errorData.message || 'Signup failed'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: 'Network error. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Secure Signup</h2>
            
            {message && (
                <div className={`message ${message.type}`}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                    <small>Must be from: {ALLOWED_DOMAINS.join(', ')}</small>
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    {errors.password && <span className="error">{errors.password}</span>}
                    <small>Min 12 chars: uppercase, lowercase, number, special char</small>
                </div>

                <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                    {errors.firstName && <span className="error">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                    {errors.lastName && <span className="error">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="secretCode">Secret Code *</label>
                    <input
                        type="text"
                        id="secretCode"
                        name="secretCode"
                        value={formData.secretCode}
                        onChange={handleChange}
                        required
                    />
                    {errors.secretCode && <span className="error">{errors.secretCode}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="assistant">Assistant</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
};

export default SecureSignup;
```

### **React with Custom Hook**

```jsx
// hooks/useSecureSignup.js
import { useState } from 'react';
import axios from 'axios';

const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    appId: process.env.REACT_APP_APP_ID || 'your_app_id',
    serviceKey: process.env.REACT_APP_SERVICE_KEY || 'your_service_key'
};

export const useSecureSignup = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const signup = async (formData) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await axios.post(
                `${API_CONFIG.baseURL}/api/auth/secure-signup`,
                {
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    secretCode: formData.secretCode.trim().toUpperCase(),
                    role: formData.role || 'user'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-ID': API_CONFIG.appId,
                        'X-Service-Key': API_CONFIG.serviceKey
                    }
                }
            );

            if (response.data.success) {
                setSuccess(true);
                return response.data;
            }
        } catch (err) {
            const errorData = err.response?.data || { message: 'Signup failed' };
            setError(errorData);
            throw errorData;
        } finally {
            setLoading(false);
        }
    };

    return { signup, loading, error, success };
};

// Usage in component
import { useSecureSignup } from './hooks/useSecureSignup';

const SignupForm = () => {
    const { signup, loading, error, success } = useSecureSignup();
    const [formData, setFormData] = useState({ /* ... */ });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await signup(formData);
            console.log('Signup successful:', result);
        } catch (err) {
            console.error('Signup error:', err);
        }
    };

    // ... rest of component
};
```

---

## 🅰️ **Vue.js Example**

### **Vue 3 Composition API**

```vue
<template>
  <div class="signup-container">
    <h2>Secure Signup</h2>

    <div v-if="message" :class="['message', message.type]">
      {{ message.type === 'success' ? '✅' : '❌' }} {{ message.text }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email *</label>
        <input
          type="email"
          id="email"
          v-model="formData.email"
          required
        />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>

      <div class="form-group">
        <label for="password">Password *</label>
        <input
          type="password"
          id="password"
          v-model="formData.password"
          required
        />
        <span v-if="errors.password" class="error">{{ errors.password }}</span>
      </div>

      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          v-model="formData.firstName"
          required
        />
        <span v-if="errors.firstName" class="error">{{ errors.firstName }}</span>
      </div>

      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          v-model="formData.lastName"
          required
        />
        <span v-if="errors.lastName" class="error">{{ errors.lastName }}</span>
      </div>

      <div class="form-group">
        <label for="secretCode">Secret Code *</label>
        <input
          type="text"
          id="secretCode"
          v-model="formData.secretCode"
          required
        />
        <span v-if="errors.secretCode" class="error">{{ errors.secretCode }}</span>
      </div>

      <div class="form-group">
        <label for="role">Role</label>
        <select id="role" v-model="formData.role">
          <option value="user">User</option>
          <option value="staff">Staff</option>
          <option value="assistant">Assistant</option>
        </select>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing up...' : 'Sign Up' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appId: import.meta.env.VITE_APP_ID || 'your_app_id',
  serviceKey: import.meta.env.VITE_SERVICE_KEY || 'your_service_key'
};

const formData = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  secretCode: '',
  role: 'user'
});

const errors = ref({});
const loading = ref(false);
const message = ref(null);

const handleSubmit = async () => {
  errors.value = {};
  message.value = null;

  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    const response = await axios.post(
      `${API_CONFIG.baseURL}/api/auth/secure-signup`,
      {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        secretCode: formData.secretCode.trim().toUpperCase(),
        role: formData.role
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-App-ID': API_CONFIG.appId,
          'X-Service-Key': API_CONFIG.serviceKey
        }
      }
    );

    if (response.data.success) {
      message.value = {
        type: 'success',
        text: response.data.message
      };
      // Reset form or redirect
    }
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data;
      
      if (errorData.errors) {
        errorData.errors.forEach(err => {
          const field = err.field || err.param;
          errors.value[field] = err.message || err.msg;
        });
      }
      
      message.value = {
        type: 'error',
        text: errorData.message || 'Signup failed'
      };
    }
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  // Add validation logic here
  return true;
};
</script>
```

---

## 🔷 **Angular Example**

### **Angular Service**

```typescript
// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private appId = 'your_app_id'; // Get from environment
  private serviceKey = 'your_service_key'; // Get from environment

  constructor(private http: HttpClient) {}

  secureSignup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretCode: string;
    role?: string;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-App-ID': this.appId,
      'X-Service-Key': this.serviceKey
    });

    return this.http.post(`${this.apiUrl}/secure-signup`, {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      secretCode: data.secretCode.trim().toUpperCase(),
      role: data.role || 'user'
    }, { headers });
  }
}
```

### **Angular Component**

```typescript
// components/signup.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  allowedDomains = [
    'connexit.biz',
    'connexcodeworks.biz',
    'conex360.biz',
    'connexvectra.biz'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.domainValidator.bind(this)]],
      password: ['', [Validators.required, Validators.minLength(12), this.passwordValidator]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      secretCode: ['', [Validators.required, Validators.minLength(5)]],
      role: ['user']
    });
  }

  domainValidator(control: any) {
    const email = control.value;
    if (!email) return null;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!this.allowedDomains.includes(domain)) {
      return { invalidDomain: true };
    }
    return null;
  }

  passwordValidator(control: any) {
    const password = control.value;
    if (!password) return null;
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return { passwordComplexity: true };
    }
    return null;
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.authService.secureSignup(this.signupForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/verify-email'], {
              queryParams: { email: response.data.email }
            });
          }, 2000);
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Signup failed';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
```

---

## ✅ **Form Validation**

### **Client-Side Validation Rules**

```javascript
const validationRules = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        allowedDomains: ['connexit.biz', 'connexcodeworks.biz', 'conex360.biz', 'connexvectra.biz'],
        validate: (email) => {
            const domain = email.split('@')[1]?.toLowerCase();
            return validationRules.email.allowedDomains.includes(domain);
        }
    },
    password: {
        required: true,
        minLength: 12,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])/,
        validate: (password) => {
            return password.length >= 12 &&
                   /[a-z]/.test(password) &&
                   /[A-Z]/.test(password) &&
                   /\d/.test(password) &&
                   /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password);
        }
    },
    firstName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/,
        validate: (name) => {
            return name.length >= 2 && 
                   name.length <= 50 && 
                   /^[a-zA-Z\s'-]+$/.test(name);
        }
    },
    lastName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/,
        validate: (name) => {
            return name.length >= 2 && 
                   name.length <= 50 && 
                   /^[a-zA-Z\s'-]+$/.test(name);
        }
    },
    secretCode: {
        required: true,
        minLength: 5,
        maxLength: 100,
        validate: (code) => {
            return code.trim().length >= 5 && code.trim().length <= 100;
        }
    }
};
```

---

## 🚨 **Error Handling**

### **Error Response Structure**

```javascript
// Success Response
{
  "success": true,
  "message": "Account created successfully...",
  "data": {
    "userId": 123,
    "email": "user@connexit.biz",
    "role": "user",
    "verificationRequired": true
  }
}

// Error Response with Validation Errors
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 12 characters long",
      "value": "short"
    }
  ]
}

// Error Response - Invalid Secret Code
{
  "success": false,
  "message": "Invalid or inactive secret code"
}
```

### **Error Handling Function**

```javascript
function handleSignupError(error) {
    if (error.response) {
        const errorData = error.response.data;
        
        // Validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
            const fieldErrors = {};
            errorData.errors.forEach(err => {
                const field = err.field || err.param;
                fieldErrors[field] = err.message || err.msg;
            });
            return {
                type: 'validation',
                errors: fieldErrors,
                message: errorData.message
            };
        }
        
        // Other errors
        return {
            type: 'error',
            message: errorData.message || 'Signup failed',
            status: error.response.status
        };
    } else if (error.request) {
        return {
            type: 'network',
            message: 'Network error. Please check your connection.'
        };
    } else {
        return {
            type: 'error',
            message: error.message || 'An unexpected error occurred'
        };
    }
}
```

---

## 🎯 **Best Practices**

### **1. Environment Variables**

Store API credentials in environment variables:

```javascript
// .env file
REACT_APP_API_URL=http://localhost:3000
REACT_APP_APP_ID=your_app_id
REACT_APP_SERVICE_KEY=your_service_key

// Usage
const API_URL = process.env.REACT_APP_API_URL;
const APP_ID = process.env.REACT_APP_APP_ID;
const SERVICE_KEY = process.env.REACT_APP_SERVICE_KEY;
```

### **2. Input Sanitization**

```javascript
function sanitizeInput(data) {
    return {
        email: data.email.trim().toLowerCase(),
        password: data.password, // Don't trim password
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        secretCode: data.secretCode.trim().toUpperCase(),
        role: data.role || 'user'
    };
}
```

### **3. Loading States**

```javascript
const [loading, setLoading] = useState(false);

// Disable form during submission
<button type="submit" disabled={loading}>
    {loading ? 'Signing up...' : 'Sign Up'}
</button>
```

### **4. Success Handling**

```javascript
if (response.data.success) {
    // Show success message
    showMessage('Account created! Please check your email.');
    
    // Redirect to verification page
    setTimeout(() => {
        window.location.href = `/verify-email?email=${response.data.data.email}`;
    }, 2000);
}
```

### **5. Password Strength Indicator**

```javascript
function checkPasswordStrength(password) {
    let strength = 0;
    const checks = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    return {
        strength, // 0-5
        checks,
        isValid: strength === 5
    };
}
```

---

## 📦 **Complete Example: React with TypeScript**

```typescript
// types/signup.ts
export interface SignupFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    secretCode: string;
    role?: 'user' | 'staff' | 'assistant';
}

export interface SignupResponse {
    success: boolean;
    message: string;
    data?: {
        userId: number;
        email: string;
        role: string;
        verificationRequired: boolean;
        emailDomain: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        value?: string;
    }>;
}

// services/signupService.ts
import axios from 'axios';
import { SignupFormData, SignupResponse } from '../types/signup';

const API_CONFIG = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    appId: process.env.REACT_APP_APP_ID || 'your_app_id',
    serviceKey: process.env.REACT_APP_SERVICE_KEY || 'your_service_key'
};

export const signupService = {
    async signup(data: SignupFormData): Promise<SignupResponse> {
        const response = await axios.post<SignupResponse>(
            `${API_CONFIG.baseURL}/api/auth/secure-signup`,
            {
                email: data.email.trim().toLowerCase(),
                password: data.password,
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                secretCode: data.secretCode.trim().toUpperCase(),
                role: data.role || 'user'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-ID': API_CONFIG.appId,
                    'X-Service-Key': API_CONFIG.serviceKey
                }
            }
        );
        return response.data;
    }
};
```

---

## 🔄 **Complete Signup Flow**

```javascript
async function completeSignupFlow(formData) {
    try {
        // 1. Validate client-side
        if (!validateForm(formData)) {
            return { success: false, message: 'Please fix validation errors' };
        }

        // 2. Submit signup
        const response = await fetch('/api/auth/secure-signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-ID': APP_ID,
                'X-Service-Key': SERVICE_KEY
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        // 3. Handle response
        if (data.success) {
            // Show success message
            showSuccessMessage(data.message);
            
            // Store email for verification page
            localStorage.setItem('pendingVerificationEmail', data.data.email);
            
            // Redirect to verification
            window.location.href = `/verify-email?email=${encodeURIComponent(data.data.email)}`;
            
            return { success: true, data: data.data };
        } else {
            // Handle errors
            if (data.errors) {
                displayValidationErrors(data.errors);
            } else {
                showErrorMessage(data.message);
            }
            return { success: false, errors: data.errors, message: data.message };
        }
    } catch (error) {
        console.error('Signup error:', error);
        showErrorMessage('Network error. Please try again.');
        return { success: false, message: 'Network error' };
    }
}
```

---

## 📱 **Mobile App Example (React Native)**

```javascript
import axios from 'axios';

const API_CONFIG = {
    baseURL: 'http://your-api-url.com',
    appId: 'your_app_id',
    serviceKey: 'your_service_key'
};

const secureSignup = async (formData) => {
    try {
        const response = await axios.post(
            `${API_CONFIG.baseURL}/api/auth/secure-signup`,
            {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                secretCode: formData.secretCode.trim().toUpperCase(),
                role: formData.role || 'user'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-ID': API_CONFIG.appId,
                    'X-Service-Key': API_CONFIG.serviceKey
                }
            }
        );

        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Signup failed' };
    }
};
```

---

## 🎨 **UI/UX Best Practices**

1. **Real-time Validation:** Show errors as user types
2. **Password Strength Indicator:** Visual feedback for password requirements
3. **Loading States:** Disable form and show spinner during submission
4. **Success Feedback:** Clear success message with next steps
5. **Error Display:** Show field-specific errors inline
6. **Email Domain Hint:** Show allowed domains near email field
7. **Password Requirements:** Display requirements checklist

---

## 🔐 **Security Best Practices**

1. **Never store credentials in code:** Use environment variables
2. **HTTPS in production:** Always use HTTPS for API calls
3. **Input sanitization:** Trim and validate all inputs
4. **Error messages:** Don't expose sensitive information
5. **Rate limiting:** Implement client-side rate limiting
6. **CSRF protection:** Use tokens if needed

---

## 🚨 **API Error Handling Guide**

### **Understanding API Errors**

APIs can return various types of errors. Here's how to handle them properly on the frontend:

### **1. HTTP Status Codes**

| Status Code | Meaning | Frontend Action |
|------------|---------|----------------|
| 200 | Success | Process data normally |
| 201 | Created | Show success message, redirect if needed |
| 400 | Bad Request | Show validation errors to user |
| 401 | Unauthorized | Redirect to login page |
| 403 | Forbidden | Show "Access denied" message |
| 404 | Not Found | Show "Resource not found" message |
| 409 | Conflict | Show conflict message (e.g., email exists) |
| 500 | Server Error | Show generic error, log details |
| 503 | Service Unavailable | Show "Service temporarily unavailable" |

### **2. Error Response Structure**

```javascript
// Standard error response format
{
  "success": false,
  "message": "Error message for user",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "error": "Technical error details (for debugging)"
}
```

### **3. Generic Error Handler**

```javascript
/**
 * Handle API errors gracefully
 * @param {Response} response - Fetch API response
 * @param {string} defaultMessage - Default error message
 * @returns {Promise<Object>} Error object
 */
async function handleApiError(response, defaultMessage = 'An error occurred') {
    let errorData;
    
    try {
        errorData = await response.json();
    } catch (e) {
        // Response is not JSON
        return {
            success: false,
            message: defaultMessage,
            status: response.status
        };
    }

    // Handle different error types
    switch (response.status) {
        case 400:
            return {
                success: false,
                message: errorData.message || 'Validation failed',
                errors: errorData.errors || [],
                status: 400
            };
        
        case 401:
            // Token expired or invalid
            localStorage.removeItem('authToken');
            return {
                success: false,
                message: 'Session expired. Please login again.',
                redirectTo: '/login',
                status: 401
            };
        
        case 403:
            return {
                success: false,
                message: errorData.message || 'Access denied',
                status: 403
            };
        
        case 500:
            // Server error - don't expose technical details
            console.error('Server error:', errorData);
            return {
                success: false,
                message: 'Server error. Please try again later.',
                status: 500
            };
        
        default:
            return {
                success: false,
                message: errorData.message || defaultMessage,
                errors: errorData.errors || [],
                status: response.status
            };
    }
}
```

### **4. Database Collation Errors**

**⚠️ Backend Fixed:** Database collation errors (like `Illegal mix of collations`) have been fixed on the backend side. However, if you encounter a 500 error with database-related messages, here's how to handle it:

```javascript
async function makeApiRequest(url, options) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await handleApiError(response);
            
            // Check for database errors
            if (errorData.message && errorData.message.includes('collation')) {
                console.error('Database error detected:', errorData);
                
                // Show user-friendly message
                return {
                    success: false,
                    message: 'Data processing error. Please contact support if this persists.',
                    technicalError: errorData.message // For debugging
                };
            }
            
            return errorData;
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        // Network error
        console.error('Network error:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.',
            error: error.message
        };
    }
}
```

### **5. Complete Error Handling Example**

```javascript
class ApiClient {
    constructor(baseURL, appId, serviceKey) {
        this.baseURL = baseURL;
        this.appId = appId;
        this.serviceKey = serviceKey;
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-App-ID': this.appId,
            'X-Service-Key': this.serviceKey,
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        };
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            });

            // Handle non-OK responses
            if (!response.ok) {
                return await this.handleError(response);
            }

            // Parse successful response
            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: data.message
            };

        } catch (error) {
            // Network or parsing errors
            console.error('API request failed:', error);
            return {
                success: false,
                message: 'Network error. Please check your connection.',
                error: error.message
            };
        }
    }

    async handleError(response) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: 'An error occurred' };
        }

        // Handle specific status codes
        switch (response.status) {
            case 400:
                return {
                    success: false,
                    message: errorData.message || 'Validation failed',
                    errors: errorData.errors || [],
                    status: 400
                };

            case 401:
                // Clear token and redirect
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                return {
                    success: false,
                    message: 'Session expired',
                    status: 401
                };

            case 403:
                return {
                    success: false,
                    message: errorData.message || 'Access denied',
                    status: 403
                };

            case 500:
                // Log technical error but show user-friendly message
                console.error('Server error:', errorData);
                return {
                    success: false,
                    message: 'Server error. Please try again later.',
                    status: 500,
                    technicalError: errorData.error // For debugging
                };

            default:
                return {
                    success: false,
                    message: errorData.message || 'An error occurred',
                    errors: errorData.errors || [],
                    status: response.status
                };
        }
    }

    // Convenience methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Usage example
const api = new ApiClient(
    'http://localhost:3000/api',
    'your_app_id',
    'your_service_key'
);

// Making a request with error handling
const result = await api.get('/dashboard/todays-schedule');

if (result.success) {
    console.log('Data:', result.data);
} else {
    // Handle error
    if (result.errors) {
        // Display validation errors
        result.errors.forEach(err => {
            console.error(`${err.field}: ${err.message}`);
        });
    } else {
        // Display general error message
        alert(result.message);
    }
}
```

### **6. React Error Handling Hook**

```jsx
import { useState } from 'react';

function useApiRequest() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const execute = async (apiCall) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await apiCall();
            
            if (result.success) {
                setData(result.data);
                return result;
            } else {
                setError({
                    message: result.message,
                    errors: result.errors || [],
                    status: result.status
                });
                return result;
            }
        } catch (err) {
            const errorObj = {
                message: 'Network error. Please try again.',
                error: err.message
            };
            setError(errorObj);
            return { success: false, ...errorObj };
        } finally {
            setLoading(false);
        }
    };

    return { execute, loading, error, data };
}

// Usage in component
function DashboardComponent() {
    const { execute, loading, error, data } = useApiRequest();

    const loadSchedule = async () => {
        const result = await execute(() => 
            api.get('/dashboard/todays-schedule')
        );

        if (!result.success) {
            // Error is already set in the hook
            console.error('Failed to load schedule:', error);
        }
    };

    return (
        <div>
            {loading && <div>Loading...</div>}
            {error && <div className="error">{error.message}</div>}
            {data && <div>{/* Render data */}</div>}
        </div>
    );
}
```

### **7. Error Display Components**

```javascript
// ErrorDisplay Component (React)
function ErrorDisplay({ error, onDismiss }) {
    if (!error) return null;

    return (
        <div className="error-container">
            <div className="error-header">
                <span className="error-icon">⚠️</span>
                <h3>Error</h3>
                {onDismiss && (
                    <button onClick={onDismiss} className="error-close">×</button>
                )}
            </div>
            
            <div className="error-message">
                {error.message}
            </div>
            
            {error.errors && error.errors.length > 0 && (
                <div className="error-details">
                    <ul>
                        {error.errors.map((err, index) => (
                            <li key={index}>
                                <strong>{err.field || err.param}:</strong> {err.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Usage
function MyComponent() {
    const [error, setError] = useState(null);

    const handleApiCall = async () => {
        const result = await api.get('/some-endpoint');
        if (!result.success) {
            setError(result);
        }
    };

    return (
        <div>
            <ErrorDisplay error={error} onDismiss={() => setError(null)} />
            {/* Rest of component */}
        </div>
    );
}
```

### **8. Best Practices for Error Handling**

1. **Always check response status** before processing data
2. **Display user-friendly messages** - don't expose technical details
3. **Log technical errors** to console for debugging
4. **Handle network errors** separately from API errors
5. **Show validation errors** inline next to form fields
6. **Implement retry logic** for transient errors (network issues)
7. **Clear sensitive data** on authentication errors
8. **Provide fallback UI** when API calls fail

---

## 📚 **Additional Resources**

- [API Documentation](./SECURE_SIGNUP_API_GUIDE.md)
- [Test Page](./public/test-secure-signup.html)
- [Test Script](./test-secure-signup.js)

---

**Last Updated:** 2025-01-15

