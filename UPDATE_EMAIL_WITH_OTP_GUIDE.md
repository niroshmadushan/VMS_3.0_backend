# 📧 Update Email with OTP Verification - Complete Guide

## 🎯 Overview

This guide covers the OTP-based email update flow where:
1. User updates email → System sends OTP to new email
2. User enters OTP from frontend
3. System verifies OTP and updates email

**2 APIs Required:**
1. **Update Email** - Sends OTP to new email
2. **Verify Email OTP** - Verifies OTP and completes email update

---

## 🔄 Complete Flow

```
Step 1: User enters new email
   ↓
Step 2: Call PUT /api/my-profile/email
   ↓
Step 3: System sends OTP to NEW email (6-digit code)
   ↓
Step 4: User receives OTP in email
   ↓
Step 5: User enters email + OTP in frontend
   ↓
Step 6: Call POST /api/my-profile/verify-email-otp
   ↓
Step 7: System verifies OTP and updates email ✅
```

---

## 🔧 API 1: Update Email (Send OTP)

### **Endpoint:**
```
PUT http://localhost:3000/api/my-profile/email
```

### **Request:**

**Method:** `PUT`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

**Body:**
```javascript
{
  "email": "newemail@example.com"
}
```

### **Response:**

**Success (200):**
```json
{
  "success": true,
  "message": "OTP sent to your new email address. Please verify to complete the email update.",
  "data": {
    "email": "newemail@example.com"
  }
}
```

**Error - Email Already Exists (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**Error - Unauthorized (401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### **JavaScript Example:**

```javascript
async function requestEmailUpdate(newEmail) {
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await fetch('http://localhost:3000/api/my-profile/email', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: newEmail
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ OTP sent to:', result.data.email)
      console.log('📧 Check your email for the 6-digit code')
      return { success: true, email: result.data.email }
    } else {
      console.error('❌ Error:', result.message)
      return { success: false, message: result.message }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return { success: false, message: 'Network error' }
  }
}

// Usage
const result = await requestEmailUpdate('newemail@example.com')
if (result.success) {
  // Show OTP input form
  showOTPForm(result.email)
}
```

---

## ✅ API 2: Verify Email OTP

### **Endpoint:**
```
POST http://localhost:3000/api/my-profile/verify-email-otp
```

### **Request:**

**Method:** `POST`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

**Body:**
```javascript
{
  "email": "newemail@example.com",
  "otpCode": "123456"
}
```

### **Response:**

**Success (200):**
```json
{
  "success": true,
  "message": "Email updated and verified successfully!"
}
```

**Error - Invalid OTP (400):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP code"
}
```

**Error - Email Already Exists (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

**Error - Unauthorized (401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### **JavaScript Example:**

```javascript
async function verifyEmailOTP(email, otpCode) {
  const token = localStorage.getItem('authToken')
  
  try {
    const response = await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: email,
        otpCode: otpCode
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Email updated and verified!')
      return { success: true }
    } else {
      console.error('❌ Error:', result.message)
      return { success: false, message: result.message }
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return { success: false, message: 'Network error' }
  }
}

// Usage
const result = await verifyEmailOTP('newemail@example.com', '123456')
if (result.success) {
  alert('Email updated successfully!')
  // Refresh profile or redirect
}
```

---

## 💻 Complete HTML Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Update Email with OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
        }
        .form-group {
            margin: 15px 0;
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
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .message {
            padding: 12px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .hidden {
            display: none;
        }
        .otp-input {
            font-size: 24px;
            text-align: center;
            letter-spacing: 10px;
        }
    </style>
</head>
<body>
    <h2>Update Email Address</h2>

    <!-- Step 1: Enter New Email -->
    <div id="emailForm">
        <div class="form-group">
            <label>Current Email:</label>
            <input type="email" id="currentEmail" readonly>
        </div>

        <div class="form-group">
            <label>New Email:</label>
            <input type="email" id="newEmail" required placeholder="Enter new email address">
        </div>

        <button onclick="sendOTP()">Send Verification Code</button>
    </div>

    <!-- Step 2: Enter OTP -->
    <div id="otpForm" class="hidden">
        <div class="message info">
            <strong>📧 Verification Code Sent!</strong><br>
            We've sent a 6-digit code to <strong id="sentToEmail"></strong><br>
            Please check your inbox and enter the code below.
        </div>

        <div class="form-group">
            <label>Enter 6-Digit Code:</label>
            <input type="text" id="otpCode" class="otp-input" maxlength="6" placeholder="000000" required>
        </div>

        <button onclick="verifyOTP()">Verify Code</button>
        <button onclick="resendOTP()" style="background: #6c757d; margin-top: 10px;">Resend Code</button>
        <button onclick="cancelOTP()" style="background: #dc3545; margin-top: 10px;">Cancel</button>
    </div>

    <div id="message"></div>

    <script>
        const token = localStorage.getItem('authToken')
        const messageDiv = document.getElementById('message')
        let pendingEmail = ''

        // Load current email on page load
        async function loadCurrentEmail() {
            try {
                const response = await fetch('http://localhost:3000/api/my-profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const result = await response.json()
                if (result.success) {
                    document.getElementById('currentEmail').value = result.data.email
                }
            } catch (error) {
                console.error('Error loading email:', error)
            }
        }

        // Step 1: Send OTP to new email
        async function sendOTP() {
            const newEmail = document.getElementById('newEmail').value
            
            if (!newEmail) {
                showMessage('Please enter a new email address', 'error')
                return
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(newEmail)) {
                showMessage('Please enter a valid email address', 'error')
                return
            }

            messageDiv.innerHTML = ''
            
            try {
                const response = await fetch('http://localhost:3000/api/my-profile/email', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: newEmail })
                })

                const result = await response.json()

                if (result.success) {
                    pendingEmail = result.data.email
                    
                    // Hide email form, show OTP form
                    document.getElementById('emailForm').classList.add('hidden')
                    document.getElementById('otpForm').classList.remove('hidden')
                    document.getElementById('sentToEmail').textContent = pendingEmail
                    
                    showMessage('✅ Verification code sent! Check your email.', 'success')
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error. Please try again.', 'error')
            }
        }

        // Step 2: Verify OTP
        async function verifyOTP() {
            const otpCode = document.getElementById('otpCode').value
            
            if (!otpCode || otpCode.length !== 6) {
                showMessage('Please enter the 6-digit code', 'error')
                return
            }

            messageDiv.innerHTML = ''
            
            try {
                const response = await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: pendingEmail,
                        otpCode: otpCode
                    })
                })

                const result = await response.json()

                if (result.success) {
                    showMessage('✅ Email updated and verified successfully!', 'success')
                    
                    // Reset forms
                    setTimeout(() => {
                        document.getElementById('emailForm').classList.remove('hidden')
                        document.getElementById('otpForm').classList.add('hidden')
                        document.getElementById('newEmail').value = ''
                        document.getElementById('otpCode').value = ''
                        loadCurrentEmail()
                        messageDiv.innerHTML = ''
                    }, 3000)
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error. Please try again.', 'error')
            }
        }

        // Resend OTP
        async function resendOTP() {
            await sendOTP()
        }

        // Cancel OTP process
        function cancelOTP() {
            document.getElementById('emailForm').classList.remove('hidden')
            document.getElementById('otpForm').classList.add('hidden')
            document.getElementById('newEmail').value = ''
            document.getElementById('otpCode').value = ''
            messageDiv.innerHTML = ''
            pendingEmail = ''
        }

        // Show message helper
        function showMessage(text, type) {
            messageDiv.innerHTML = `<div class="message ${type}">${text}</div>`
        }

        // Load current email on page load
        loadCurrentEmail()
    </script>
</body>
</html>
```

---

## ⚛️ React Implementation

```jsx
import React, { useState, useEffect } from 'react';

function UpdateEmailWithOTP() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCurrentEmail();
  }, []);

  const loadCurrentEmail = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:3000/api/my-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setCurrentEmail(result.data.email);
      }
    } catch (error) {
      console.error('Error loading email:', error);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:3000/api/my-profile/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail })
      });

      const result = await response.json();

      if (result.success) {
        setShowOTPForm(true);
        setMessage({
          type: 'success',
          text: `✅ Verification code sent to ${result.data.email}. Check your inbox!`
        });
      } else {
        setMessage({ type: 'error', text: `❌ ${result.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          otpCode: otpCode
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: '✅ Email updated and verified successfully!'
        });
        
        // Reset form
        setTimeout(() => {
          setShowOTPForm(false);
          setNewEmail('');
          setOtpCode('');
          setMessage({ type: '', text: '' });
          loadCurrentEmail();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: `❌ ${result.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowOTPForm(false);
    setNewEmail('');
    setOtpCode('');
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="update-email-container">
      <h2>Update Email Address</h2>

      {!showOTPForm ? (
        // Step 1: Enter New Email
        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <label>Current Email:</label>
            <input type="email" value={currentEmail} readOnly />
          </div>

          <div className="form-group">
            <label>New Email:</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        // Step 2: Enter OTP
        <div>
          <div className="info-box">
            <strong>📧 Verification Code Sent!</strong><br />
            We've sent a 6-digit code to <strong>{newEmail}</strong><br />
            Please check your inbox and enter the code below.
          </div>

          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter 6-Digit Code:</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength="6"
                placeholder="000000"
                className="otp-input"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={handleSendOTP} disabled={loading}>
              Resend Code
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default UpdateEmailWithOTP;
```

---

## 📊 API Summary

| Step | API | Method | Endpoint | Auth | Body |
|------|-----|--------|----------|------|------|
| 1 | **Send OTP** | PUT | `/api/my-profile/email` | JWT | `{ email }` |
| 2 | **Verify OTP** | POST | `/api/my-profile/verify-email-otp` | JWT | `{ email, otpCode }` |

---

## 🔑 Key Points

### **API 1: Update Email (Send OTP)**
- ✅ Requires JWT token
- ✅ Checks if email already exists
- ✅ Generates 6-digit OTP
- ✅ Stores OTP in database (expires in 10 minutes)
- ✅ Sends OTP to NEW email address
- ❌ Does NOT update email yet

### **API 2: Verify Email OTP**
- ✅ Requires JWT token
- ✅ Requires both email and OTP code
- ✅ Verifies OTP is valid and not expired
- ✅ Updates email in database
- ✅ Marks email as verified
- ✅ Marks OTP as used

---

## ⏰ OTP Details

| Property | Value |
|----------|-------|
| **Length** | 6 digits |
| **Expiry** | 10 minutes |
| **Type** | `email_verification` |
| **Single Use** | Yes (marked as used after verification) |
| **Format** | Example: `123456` |

---

## 🎯 Complete Flow Example

```javascript
// Complete flow implementation
async function updateEmailWithOTP() {
  const token = localStorage.getItem('authToken')
  const newEmail = 'newemail@example.com'
  
  // Step 1: Send OTP
  console.log('Step 1: Sending OTP...')
  const sendResponse = await fetch('http://localhost:3000/api/my-profile/email', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email: newEmail })
  })
  
  const sendResult = await sendResponse.json()
  
  if (sendResult.success) {
    console.log('✅ OTP sent to:', sendResult.data.email)
    console.log('📧 User receives 6-digit code in email')
    
    // Step 2: User enters OTP (get from user input)
    const userOTP = prompt('Enter OTP from email:')
    
    // Step 3: Verify OTP
    console.log('Step 2: Verifying OTP...')
    const verifyResponse = await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: newEmail,
        otpCode: userOTP
      })
    })
    
    const verifyResult = await verifyResponse.json()
    
    if (verifyResult.success) {
      console.log('✅ Email updated and verified!')
      console.log('🎉 Process complete!')
    } else {
      console.error('❌ Verification failed:', verifyResult.message)
    }
  } else {
    console.error('❌ Failed to send OTP:', sendResult.message)
  }
}

// Run the flow
updateEmailWithOTP()
```

---

## ✅ Quick Copy-Paste

### **Send OTP:**
```javascript
const token = localStorage.getItem('authToken')

await fetch('http://localhost:3000/api/my-profile/email', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ email: 'newemail@example.com' })
})
.then(res => res.json())
.then(result => console.log(result))
```

### **Verify OTP:**
```javascript
const token = localStorage.getItem('authToken')

await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'newemail@example.com',
    otpCode: '123456'
  })
})
.then(res => res.json())
.then(result => console.log(result))
```

---

## 📧 Email Format

Users will receive an email like this:

```
Subject: Verify Your New Email Address

Hello [Name]!

You have requested to update your email address. To complete this process, 
please use the verification code below:

┌──────────┐
│  123456  │  (6-digit code in blue box)
└──────────┘

⏰ This code will expire in 10 minutes.

Enter this code in the verification form to confirm your new email address.

If you didn't request this email change, please ignore this message.
```

---

**Both APIs are ready and working!** ✅📧

**OTP-based email verification is now live!** 🎉


