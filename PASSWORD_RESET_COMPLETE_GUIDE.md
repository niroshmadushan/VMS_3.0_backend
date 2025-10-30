# 🔐 Password Reset - Complete Guide

## 🎯 Overview

There are **2 ways** to reset password:

1. **Public Password Reset** (User forgot password - No login required)
2. **Authenticated Password Reset** (User is logged in)

---

## 📋 Method 1: Public Password Reset (Forgot Password)

**Use Case:** User forgot password and cannot login

**Flow:** Email → OTP → Verify OTP → Reset Password

### **Step 1: Request Password Reset**

**Endpoint:** `POST /api/auth/password-reset`

**Headers:**
```javascript
{
  "Content-Type": "application/json",
  "X-App-Id": "default_app_id",
  "X-Service-Key": "default_service_key"
}
```

**Body:**
```javascript
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset code has been sent"
}
```

**What Happens:**
- System sends 6-digit OTP to email
- OTP expires in 10 minutes
- User receives email with OTP code

---

### **Step 2: Verify OTP**

**Endpoint:** `POST /api/auth/password-reset/verify-otp`

**Headers:**
```javascript
{
  "Content-Type": "application/json"
}
```

**Body:**
```javascript
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password."
}
```

---

### **Step 3: Reset Password**

**Endpoint:** `POST /api/auth/password-reset/confirm`

**Headers:**
```javascript
{
  "Content-Type": "application/json"
}
```

**Body:**
```javascript
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

**What Happens:**
- Password is updated
- All user sessions are invalidated
- User must login again with new password

---

## 📋 Method 2: Authenticated Password Reset

**Use Case:** User is logged in and wants to change password

### **Option A: Request Reset Email (With Token Link)**

**Endpoint:** `POST /api/my-profile/request-password-reset`

**Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**No Body Required**

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

**What Happens:**
- System sends email with reset link
- Link format: `http://localhost:3001/reset-password?token=...`
- User clicks link and enters new password on website

---

### **Option B: Change Password (Requires Old Password)**

**Endpoint:** `POST /api/my-profile/change-password`

**Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```javascript
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**What Happens:**
- Verifies old password is correct
- Updates to new password
- User remains logged in

---

## 💻 Complete Frontend Examples

### **Example 1: Forgot Password Flow (Public)**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Forgot Password</title>
    <style>
        body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; cursor: pointer; }
        .hidden { display: none; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>Forgot Password</h2>

    <!-- Step 1: Enter Email -->
    <div id="emailStep">
        <input type="email" id="email" placeholder="Enter your email" required>
        <button onclick="requestReset()">Send Reset Code</button>
    </div>

    <!-- Step 2: Enter OTP -->
    <div id="otpStep" class="hidden">
        <p>Enter the 6-digit code sent to your email:</p>
        <input type="text" id="otpCode" maxlength="6" placeholder="000000">
        <button onclick="verifyOTP()">Verify Code</button>
    </div>

    <!-- Step 3: Enter New Password -->
    <div id="passwordStep" class="hidden">
        <input type="password" id="newPassword" placeholder="New Password" required>
        <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
        <button onclick="resetPassword()">Reset Password</button>
    </div>

    <div id="message"></div>

    <script>
        const APP_ID = 'default_app_id'
        const SERVICE_KEY = 'default_service_key'
        let userEmail = ''
        let userOTP = ''

        async function requestReset() {
            userEmail = document.getElementById('email').value
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/password-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Id': APP_ID,
                        'X-Service-Key': SERVICE_KEY
                    },
                    body: JSON.stringify({ email: userEmail })
                })

                const result = await response.json()

                if (result.success) {
                    document.getElementById('emailStep').classList.add('hidden')
                    document.getElementById('otpStep').classList.remove('hidden')
                    showMessage('✅ Reset code sent! Check your email.', 'success')
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error', 'error')
            }
        }

        async function verifyOTP() {
            userOTP = document.getElementById('otpCode').value
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/password-reset/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        otpCode: userOTP
                    })
                })

                const result = await response.json()

                if (result.success) {
                    document.getElementById('otpStep').classList.add('hidden')
                    document.getElementById('passwordStep').classList.remove('hidden')
                    showMessage('✅ Code verified! Enter new password.', 'success')
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error', 'error')
            }
        }

        async function resetPassword() {
            const newPassword = document.getElementById('newPassword').value
            const confirmPassword = document.getElementById('confirmPassword').value
            
            if (newPassword !== confirmPassword) {
                showMessage('❌ Passwords do not match', 'error')
                return
            }

            if (newPassword.length < 8) {
                showMessage('❌ Password must be at least 8 characters', 'error')
                return
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/password-reset/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        otpCode: userOTP,
                        newPassword: newPassword
                    })
                })

                const result = await response.json()

                if (result.success) {
                    showMessage('✅ Password reset successfully! Redirecting to login...', 'success')
                    setTimeout(() => {
                        window.location.href = '/login'
                    }, 2000)
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error', 'error')
            }
        }

        function showMessage(text, type) {
            document.getElementById('message').innerHTML = 
                `<div class="message ${type}">${text}</div>`
        }
    </script>
</body>
</html>
```

---

### **Example 2: Change Password (Logged In User)**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Change Password</title>
    <style>
        body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; cursor: pointer; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>Change Password</h2>

    <input type="password" id="oldPassword" placeholder="Current Password" required>
    <input type="password" id="newPassword" placeholder="New Password" required>
    <input type="password" id="confirmPassword" placeholder="Confirm New Password" required>
    <button onclick="changePassword()">Change Password</button>

    <div id="message"></div>

    <script>
        const token = localStorage.getItem('authToken')

        async function changePassword() {
            const oldPassword = document.getElementById('oldPassword').value
            const newPassword = document.getElementById('newPassword').value
            const confirmPassword = document.getElementById('confirmPassword').value
            
            if (newPassword !== confirmPassword) {
                showMessage('❌ Passwords do not match', 'error')
                return
            }

            if (newPassword.length < 8) {
                showMessage('❌ Password must be at least 8 characters', 'error')
                return
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/my-profile/change-password', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        oldPassword: oldPassword,
                        newPassword: newPassword
                    })
                })

                const result = await response.json()

                if (result.success) {
                    showMessage('✅ Password changed successfully!', 'success')
                    // Clear form
                    document.getElementById('oldPassword').value = ''
                    document.getElementById('newPassword').value = ''
                    document.getElementById('confirmPassword').value = ''
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error', 'error')
            }
        }

        function showMessage(text, type) {
            document.getElementById('message').innerHTML = 
                `<div class="message ${type}">${text}</div>`
        }
    </script>
</body>
</html>
```

---

## 📊 API Summary

### **Public Password Reset (No Login Required):**

| Step | Method | Endpoint | Body |
|------|--------|----------|------|
| 1 | POST | `/api/auth/password-reset` | `{ email }` |
| 2 | POST | `/api/auth/password-reset/verify-otp` | `{ email, otpCode }` |
| 3 | POST | `/api/auth/password-reset/confirm` | `{ email, otpCode, newPassword }` |

### **Authenticated Password Reset (Login Required):**

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/my-profile/request-password-reset` | None | JWT |
| POST | `/api/my-profile/change-password` | `{ oldPassword, newPassword }` | JWT |

---

## 🔑 Key Differences

### **Public Reset (Forgot Password):**
- ❌ No login required
- ✅ Requires email verification
- ✅ Uses OTP (6 digits)
- ✅ OTP expires in 10 minutes
- ✅ All sessions invalidated after reset

### **Authenticated Reset (Change Password):**
- ✅ Login required (JWT token)
- ✅ Requires old password
- ❌ No OTP needed
- ✅ User remains logged in

---

## ⚛️ React Component Example

```jsx
import React, { useState } from 'react';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const requestReset = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': 'default_app_id',
          'X-Service-Key': 'default_service_key'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (result.success) {
        setStep(2);
        setMessage({ type: 'success', text: 'Reset code sent! Check your email.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const verifyOTP = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/password-reset/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode })
      });

      const result = await response.json();
      if (result.success) {
        setStep(3);
        setMessage({ type: 'success', text: 'Code verified!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid code' });
    }
  };

  const resetPassword = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword })
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setTimeout(() => window.location.href = '/login', 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Reset failed' });
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      
      {step === 1 && (
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button onClick={requestReset}>Send Reset Code</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
          />
          <button onClick={verifyOTP}>Verify Code</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
          />
          <button onClick={resetPassword}>Reset Password</button>
        </div>
      )}

      {message.text && <div className={message.type}>{message.text}</div>}
    </div>
  );
}

export default ForgotPassword;
```

---

## ✅ All Password Reset Options Available!

**Public Reset:** 3-step OTP process  
**Authenticated Reset:** 2 options (email link or change with old password)  

**All working with Gmail SMTP!** 🎉🔐


