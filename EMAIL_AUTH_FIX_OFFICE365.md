# 🔧 Fix: Office 365 Email Authentication Error (535 5.7.3)

## 🐛 **Error**

```
Email service configuration error: Invalid login: 535 5.7.3 Authentication unsuccessful
```

This error indicates that the Office 365 SMTP server is rejecting the authentication credentials.

---

## ✅ **Solutions**

### **Solution 1: Enable SMTP AUTH in Microsoft 365 Admin Center**

**This is the most common fix!**

1. **Go to Microsoft 365 Admin Center:**
   - Visit: https://admin.microsoft.com
   - Sign in with admin credentials

2. **Navigate to User Settings:**
   - Go to **Users** → **Active users**
   - Find and select the user: `vmsinfo@connexit.biz`
   - Click on **Mail** tab

3. **Enable SMTP AUTH:**
   - Click **Manage email apps**
   - Check the box for **Authenticated SMTP**
   - Click **Save changes**

4. **Wait 5-10 minutes** for changes to propagate

5. **Restart your backend server**

---

### **Solution 2: Verify App Password**

1. **Check App Password:**
   - Current app password: `jrtmpywhfrydwykb`
   - Ensure it's copied correctly (no spaces, no extra characters)

2. **Generate New App Password (if needed):**
   - Sign in to: https://account.microsoft.com/security
   - Go to **Security** → **Advanced security options**
   - Click **Create a new app password**
   - Copy the generated password
   - Update `config.env` with the new password

---

### **Solution 3: Verify Two-Factor Authentication**

1. **Check if 2FA is enabled:**
   - Sign in to: https://account.microsoft.com/security
   - Verify **Two-step verification** is enabled

2. **If 2FA is not enabled:**
   - Enable it first
   - Then generate an app password

---

### **Solution 4: Try Alternative SMTP Settings**

If port 587 doesn't work, try port 465 with SSL:

**Update `config.env`:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=465
SMTP_USER=vmsinfo@connexit.biz
SMTP_PASS=jrtmpywhfrydwykb
EMAIL_FROM=vmsinfo@connexit.biz
```

**Update `services/emailService.js`:**
```javascript
this.transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
        user: config.email.user,
        pass: config.email.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});
```

---

### **Solution 5: Check Security Defaults Policy**

If your organization has **Security Defaults** enabled, it might block basic authentication:

1. **Check Security Defaults:**
   - Go to Azure Active Directory admin center
   - Navigate to **Properties** → **Manage Security defaults**
   - Check if it's enabled

2. **Options:**
   - **Option A:** Disable Security Defaults (if allowed by policy)
   - **Option B:** Use OAuth 2.0 instead of app passwords (more complex)
   - **Option C:** Configure Conditional Access to allow SMTP AUTH

---

### **Solution 6: Verify Account Status**

1. **Check if account is active:**
   - Verify `vmsinfo@connexit.biz` is an active Office 365 account
   - Check if the account is licensed
   - Ensure the account has email enabled

2. **Check account permissions:**
   - Verify the account can send emails
   - Check if there are any sending restrictions

---

## 🔍 **Step-by-Step Troubleshooting**

### **Step 1: Check Current Configuration**

Verify your `config.env` has:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=vmsinfo@connexit.biz
SMTP_PASS=jrtmpywhfrydwykb
EMAIL_FROM=vmsinfo@connexit.biz
```

### **Step 2: Enable SMTP AUTH (Most Important!)**

1. Go to: https://admin.microsoft.com
2. Users → Active users → Select `vmsinfo@connexit.biz`
3. Mail → Manage email apps → Enable **Authenticated SMTP**
4. Save and wait 5-10 minutes

### **Step 3: Test Connection**

Create a test file `test-email-connection.js`:

```javascript
require('dotenv').config({ path: './config.env' });
const nodemailer = require('nodemailer');

async function testConnection() {
    console.log('🧪 Testing Office 365 SMTP Connection...\n');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP Port:', process.env.SMTP_PORT);
    console.log('SMTP User:', process.env.SMTP_USER);
    console.log('SMTP Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('\n');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        },
        requireTLS: true,
        debug: true,
        logger: true
    });

    try {
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!');
        
        console.log('\n📧 Testing email send...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.SMTP_USER, // Send to self for testing
            subject: 'Test Email from Office 365',
            text: 'This is a test email to verify Office 365 SMTP is working.',
            html: '<p>This is a test email to verify Office 365 SMTP is working.</p>'
        });
        
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('535')) {
            console.error('\n⚠️  AUTHENTICATION ERROR');
            console.error('\nPlease check:');
            console.error('1. SMTP AUTH is enabled in Microsoft 365 admin center');
            console.error('2. App password is correct');
            console.error('3. Two-factor authentication is enabled');
            console.error('4. Account is active and licensed');
        }
    }
}

testConnection();
```

Run the test:
```bash
node test-email-connection.js
```

---

## 📋 **Checklist**

- [ ] SMTP AUTH enabled in Microsoft 365 admin center
- [ ] App password is correct: `jrtmpywhfrydwykb`
- [ ] Two-factor authentication is enabled
- [ ] Account `vmsinfo@connexit.biz` is active
- [ ] Account has email license
- [ ] Waited 5-10 minutes after enabling SMTP AUTH
- [ ] Server restarted after configuration changes
- [ ] Test connection script run successfully

---

## 🔄 **Alternative: Use OAuth 2.0 (Advanced)**

If basic authentication continues to fail, you can use OAuth 2.0:

1. **Register App in Azure AD:**
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Create new registration
   - Get Client ID and Client Secret

2. **Configure OAuth in Nodemailer:**
   ```javascript
   const transporter = nodemailer.createTransport({
       host: 'smtp.office365.com',
       port: 587,
       secure: false,
       auth: {
           type: 'OAuth2',
           user: 'vmsinfo@connexit.biz',
           clientId: 'your-client-id',
           clientSecret: 'your-client-secret',
           refreshToken: 'your-refresh-token',
           accessToken: 'your-access-token'
       }
   });
   ```

**Note:** OAuth 2.0 setup is more complex and requires Azure AD app registration.

---

## ⚠️ **Important Notes**

1. **SMTP AUTH Must Be Enabled:**
   - This is the #1 cause of authentication failures
   - Must be enabled in Microsoft 365 admin center
   - Changes take 5-10 minutes to propagate

2. **App Password Required:**
   - Cannot use regular password if 2FA is enabled
   - Must generate app password from Microsoft account settings
   - App password is different from account password

3. **Security Defaults:**
   - If enabled, may block basic authentication
   - May need to disable or configure exceptions

4. **Account Requirements:**
   - Account must be licensed (not just created)
   - Account must have email enabled
   - Account must be active (not suspended)

---

## 📞 **Quick Fix Summary**

**Most Common Fix (90% of cases):**

1. Go to: https://admin.microsoft.com
2. Users → Active users → `vmsinfo@connexit.biz`
3. Mail → Manage email apps
4. ✅ Enable **Authenticated SMTP**
5. Save and wait 5-10 minutes
6. Restart backend server

---

**Date:** 2025-01-15  
**Error:** 535 5.7.3 Authentication unsuccessful  
**Status:** 🔧 Troubleshooting guide created
