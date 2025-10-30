# 📧 Email Update with OTP - Simple Guide

## ✅ BUGS FIXED

**Bug 1:** Database column name error - FIXED ✅  
**Bug 2:** Email sending restriction - Explained below ⚠️

---

## ✅ MIGRATED TO GMAIL SMTP!

### **Email Service:**

**Now using Gmail SMTP** - Can send to **ANY email address**! 🎉

**Configuration:**
- **From:** smartvisitor.cbiz365@gmail.com
- **SMTP:** Gmail (smtp.gmail.com:587)
- **Authentication:** App Password (secure)

### **What This Means:**

✅ **Works:** Updating email to **ANY email address**  
✅ **No Restrictions:** Send to anyone  
✅ **Production Ready:** Fully configured  

**No additional setup needed!**

---

## 🔄 How Email Update Works

### **Step 1: User Requests Email Update**

```javascript
PUT http://localhost:3000/api/my-profile/email

Headers:
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

Body:
{
  "email": "anyone@example.com"  // Can be ANY email address now! ✅
}

Response:
{
  "success": true,
  "message": "OTP sent to your new email address...",
  "data": {
    "email": "niroshmax01@gmail.com"
  }
}
```

### **Step 2: User Receives OTP Email**

You receive an email with a **6-digit code** like: `329334`

### **Step 3: User Verifies OTP**

```javascript
POST http://localhost:3000/api/my-profile/verify-email-otp

Headers:
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}

Body:
{
  "email": "niroshmax01@gmail.com",
  "otpCode": "329334"
}

Response:
{
  "success": true,
  "message": "Email updated and verified successfully!"
}
```

---

## 💻 Complete Frontend Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Update Email</title>
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
    <h2>Update Email</h2>

    <!-- Step 1: Enter Email -->
    <div id="emailForm">
        <input type="email" id="newEmail" placeholder="New email address" required>
        <button onclick="sendOTP()">Send Verification Code</button>
    </div>

    <!-- Step 2: Enter OTP -->
    <div id="otpForm" class="hidden">
        <p>Enter the 6-digit code sent to your email:</p>
        <input type="text" id="otpCode" maxlength="6" placeholder="000000">
        <button onclick="verifyOTP()">Verify Code</button>
    </div>

    <div id="message"></div>

    <script>
        const token = localStorage.getItem('authToken')
        let pendingEmail = ''

        async function sendOTP() {
            const email = document.getElementById('newEmail').value
            
            try {
                const response = await fetch('http://localhost:3000/api/my-profile/email', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                })

                const result = await response.json()

                if (result.success) {
                    pendingEmail = result.data.email
                    document.getElementById('emailForm').classList.add('hidden')
                    document.getElementById('otpForm').classList.remove('hidden')
                    showMessage('✅ OTP sent! Check your email.', 'success')
                } else {
                    showMessage('❌ ' + result.message, 'error')
                }
            } catch (error) {
                showMessage('❌ Network error', 'error')
            }
        }

        async function verifyOTP() {
            const otpCode = document.getElementById('otpCode').value
            
            try {
                const response = await fetch('http://localhost:3000/api/my-profile/verify-email-otp', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: pendingEmail,
                        otpCode: otpCode
                    })
                })

                const result = await response.json()

                if (result.success) {
                    showMessage('✅ Email updated successfully!', 'success')
                    setTimeout(() => location.reload(), 2000)
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

## 📝 API Summary

| Step | API | What It Does |
|------|-----|--------------|
| 1 | `PUT /api/my-profile/email` | Sends 6-digit OTP to new email |
| 2 | User checks email | Receives OTP code (e.g., 329334) |
| 3 | `POST /api/my-profile/verify-email-otp` | Verifies OTP and updates email |

---

## ✅ Current Status

**Email Sending:**
- ✅ Can send to: **ANY email address**
- ✅ Using: Gmail SMTP (smartvisitor.cbiz365@gmail.com)
- ✅ Production ready: Yes

**OTP Details:**
- Format: 6 digits (e.g., 329334)
- Expires: 10 minutes
- Single use: Cannot reuse same OTP

---

## ✅ Testing Checklist

- [x] Database bug fixed (column names corrected)
- [x] Migrated to Gmail SMTP
- [x] OTP is generated correctly
- [x] OTP is stored in database
- [x] Email is sent successfully (to ANY email)
- [x] OTP verification works
- [x] Email is updated after verification

---

## 🚀 Ready to Use

**Current Status:**
- ✅ Gmail SMTP configured
- ✅ Can send to ANY email address
- ✅ Production-ready
- ✅ No additional setup needed

**Email Service:**
- From: smartvisitor.cbiz365@gmail.com
- SMTP: Gmail (smtp.gmail.com:587)
- Authentication: App Password (secure)

---

**All bugs are fixed and system is working perfectly!** ✅🎉
