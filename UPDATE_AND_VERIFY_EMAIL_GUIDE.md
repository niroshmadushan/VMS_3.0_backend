# 📧 Update & Verify Email - Complete Guide

## 🎯 Overview

This guide covers the complete flow for updating and verifying a user's email address.

**2 APIs Required:**
1. **Update Email** - Changes the email address
2. **Verify Email** - Verifies the new email address

---

## 📋 Complete Flow

```
Step 1: User updates email
   ↓
Step 2: Email is changed in database (marked as unverified)
   ↓
Step 3: System sends verification email to NEW email
   ↓
Step 4: User clicks verification link in email
   ↓
Step 5: Email is verified
```

---

## 🔧 API 1: Update Email

### **Endpoint:**
```
PUT http://localhost:3000/api/my-profile/email
```

### **Request:**

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
  "message": "Email updated successfully. Please verify your new email address."
}
```

**Error - Email Already Exists (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### **JavaScript Example:**

```javascript
async function updateEmail(newEmail) {
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
      console.log('✅ Email updated!')
      console.log('📧 Verification email sent to:', newEmail)
      return true
    } else {
      console.error('❌ Error:', result.message)
      return false
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return false
  }
}

// Usage
await updateEmail('newemail@example.com')
```

---

## ✅ API 2: Verify Email

### **Endpoint:**
```
POST http://localhost:3000/api/auth/verify-email
```

### **Request:**

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
}
```

**Body:**
```javascript
{
  "token": "VERIFICATION_TOKEN_FROM_EMAIL"
}
```

**Note:** The verification token comes from the email link that user clicks.

### **Response:**

**Success (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Already Verified (200):**
```json
{
  "success": true,
  "message": "Email is already verified"
}
```

**Error - Invalid Token (400):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

### **JavaScript Example:**

```javascript
async function verifyEmail(token) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token
      })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Email verified successfully!')
      return true
    } else {
      console.error('❌ Error:', result.message)
      return false
    }
  } catch (error) {
    console.error('❌ Network error:', error)
    return false
  }
}

// Usage - token comes from URL parameter
const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')
await verifyEmail(token)
```

---

## 🔄 Complete Implementation

### **Step 1: Update Email Page**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Update Email</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>Update Email Address</h2>
    
    <form id="updateEmailForm">
        <label>Current Email:</label>
        <input type="email" id="currentEmail" readonly>
        
        <label>New Email:</label>
        <input type="email" id="newEmail" required placeholder="Enter new email">
        
        <button type="submit">Update Email</button>
    </form>
    
    <div id="message"></div>

    <script>
        const token = localStorage.getItem('authToken')
        const messageDiv = document.getElementById('message')

        // Load current email
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

        // Update email
        document.getElementById('updateEmailForm').addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const newEmail = document.getElementById('newEmail').value
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
                    messageDiv.innerHTML = `
                        <div class="message success">
                            <strong>✅ Email Updated Successfully!</strong><br>
                            We've sent a verification email to <strong>${newEmail}</strong><br>
                            Please check your inbox and click the verification link.
                        </div>
                    `
                    document.getElementById('newEmail').value = ''
                    
                    // Reload current email after 2 seconds
                    setTimeout(() => {
                        loadCurrentEmail()
                    }, 2000)
                } else {
                    messageDiv.innerHTML = `
                        <div class="message error">
                            <strong>❌ Error:</strong> ${result.message}
                        </div>
                    `
                }
            } catch (error) {
                messageDiv.innerHTML = `
                    <div class="message error">
                        <strong>❌ Network Error:</strong> Please check your connection.
                    </div>
                `
            }
        })

        // Load current email on page load
        loadCurrentEmail()
    </script>
</body>
</html>
```

---

### **Step 2: Email Verification Page**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Email Verification</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center; 
        }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #007bff; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 20px auto; 
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success { color: #155724; background: #d4edda; padding: 20px; border-radius: 8px; }
        .error { color: #721c24; background: #f8d7da; padding: 20px; border-radius: 8px; }
        .icon { font-size: 48px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Email Verification</h1>
    
    <div id="status">
        <div class="spinner"></div>
        <p>Verifying your email address...</p>
    </div>

    <script>
        async function verifyEmail() {
            const statusDiv = document.getElementById('status')
            
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search)
            const token = urlParams.get('token')
            
            if (!token) {
                statusDiv.innerHTML = `
                    <div class="error">
                        <div class="icon">❌</div>
                        <h2>Invalid Verification Link</h2>
                        <p>The verification link is invalid or incomplete.</p>
                    </div>
                `
                return
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                })

                const result = await response.json()

                if (result.success) {
                    statusDiv.innerHTML = `
                        <div class="success">
                            <div class="icon">✅</div>
                            <h2>Email Verified Successfully!</h2>
                            <p>${result.message}</p>
                            <p>You can now close this window and continue using the application.</p>
                        </div>
                    `
                    
                    // Redirect to login/dashboard after 3 seconds
                    setTimeout(() => {
                        window.location.href = 'http://localhost:3001'
                    }, 3000)
                } else {
                    statusDiv.innerHTML = `
                        <div class="error">
                            <div class="icon">❌</div>
                            <h2>Verification Failed</h2>
                            <p>${result.message}</p>
                            <p>The verification link may have expired or is invalid.</p>
                        </div>
                    `
                }
            } catch (error) {
                statusDiv.innerHTML = `
                    <div class="error">
                        <div class="icon">❌</div>
                        <h2>Network Error</h2>
                        <p>Cannot connect to the server. Please check your internet connection.</p>
                    </div>
                `
            }
        }

        // Verify email on page load
        verifyEmail()
    </script>
</body>
</html>
```

---

## ⚛️ React Implementation

### **Update Email Component:**

```jsx
import React, { useState, useEffect } from 'react';

function UpdateEmail() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
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

  const handleUpdateEmail = async (e) => {
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
        setMessage({
          type: 'success',
          text: `✅ Email updated! Verification email sent to ${newEmail}. Please check your inbox.`
        });
        setNewEmail('');
        setTimeout(() => loadCurrentEmail(), 2000);
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${result.message}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Update Email Address</h2>
      
      <div>
        <label>Current Email:</label>
        <input type="email" value={currentEmail} readOnly />
      </div>

      <form onSubmit={handleUpdateEmail}>
        <label>New Email:</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Email'}
        </button>
      </form>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default UpdateEmail;
```

### **Email Verification Component:**

```jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, success: false, message: '' });

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus({
        loading: false,
        success: false,
        message: 'Invalid verification link'
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      setStatus({
        loading: false,
        success: result.success,
        message: result.message
      });

      if (result.success) {
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: 'Network error. Please try again.'
      });
    }
  };

  if (status.loading) {
    return (
      <div className="verify-container">
        <div className="spinner"></div>
        <p>Verifying your email...</p>
      </div>
    );
  }

  return (
    <div className="verify-container">
      {status.success ? (
        <div className="success">
          <div className="icon">✅</div>
          <h2>Email Verified Successfully!</h2>
          <p>{status.message}</p>
          <p>Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="error">
          <div className="icon">❌</div>
          <h2>Verification Failed</h2>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;
```

---

## 📊 API Summary

| API | Method | Endpoint | Auth Required | Purpose |
|-----|--------|----------|---------------|---------|
| **Update Email** | PUT | `/api/my-profile/email` | ✅ Yes (JWT) | Change email address |
| **Verify Email** | POST | `/api/auth/verify-email` | ❌ No | Verify new email with token |

---

## 🔑 Key Points

### **Update Email API:**
- ✅ Requires JWT token in Authorization header
- ✅ Checks if email already exists
- ✅ Marks email as unverified
- ✅ System automatically sends verification email

### **Verify Email API:**
- ❌ Does NOT require JWT token
- ✅ Requires verification token from email
- ✅ Token comes from URL parameter
- ✅ Marks email as verified

---

## 📧 Email Verification Link Format

When user updates email, they receive an email with a link like:
```
http://localhost:3000/verify-email?token=abc123xyz456
```

Your verification page should:
1. Extract the `token` from URL
2. Call `POST /api/auth/verify-email` with the token
3. Show success/error message

---

## ✅ Complete Flow Example

```javascript
// 1. Update Email
async function updateAndVerifyEmail(newEmail) {
  const token = localStorage.getItem('authToken')
  
  // Step 1: Update email
  console.log('Step 1: Updating email...')
  const updateResponse = await fetch('http://localhost:3000/api/my-profile/email', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email: newEmail })
  })
  
  const updateResult = await updateResponse.json()
  
  if (updateResult.success) {
    console.log('✅ Email updated!')
    console.log('📧 Verification email sent to:', newEmail)
    console.log('⏳ Waiting for user to click verification link...')
    
    // User receives email and clicks link
    // Link opens: http://localhost:3000/verify-email?token=...
    
    // Step 2: Verify email (happens on verification page)
    // This is handled by the verification page code above
  } else {
    console.error('❌ Update failed:', updateResult.message)
  }
}

// Usage
updateAndVerifyEmail('newemail@example.com')
```

---

## 🎯 Quick Copy-Paste

### **Update Email:**
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

### **Verify Email:**
```javascript
const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('token')

await fetch('http://localhost:3000/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
})
.then(res => res.json())
.then(result => console.log(result))
```

---

**Both APIs are ready to use!** ✅📧


