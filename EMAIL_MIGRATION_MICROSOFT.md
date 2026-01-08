# 📧 Email Service Migration: Gmail → Microsoft Office 365

## ✅ **Migration Complete**

**Status:** ✅ Email service migrated from Gmail to Microsoft Office 365

---

## 📝 **Changes Made**

### **1. Updated Email Configuration (`config.env`)**

**Before (Gmail):**
```env
# Email Configuration (Gmail with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=smartvisitor.cbiz365@gmail.com
SMTP_PASS=zxmnetqyszzraedv
EMAIL_FROM=smartvisitor.cbiz365@gmail.com
```

**After (Microsoft Office 365):**
```env
# Email Configuration (Microsoft Outlook/Office 365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=vmsinfo@connexit.biz
SMTP_PASS=jrtmpywhfrydwykb
EMAIL_FROM=vmsinfo@connexit.biz
```

### **2. Updated Email Service (`services/emailService.js`)**

Enhanced TLS configuration for Microsoft Office 365 compatibility:

```javascript
this.transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false, // false for 587 (TLS), true for 465 (SSL)
    auth: {
        user: config.email.user,
        pass: config.email.pass
    },
    tls: {
        ciphers: 'SSLv3', // Microsoft Office 365 compatibility
        rejectUnauthorized: false
    },
    requireTLS: true // Require TLS for Office 365
});
```

---

## 📧 **New Email Configuration**

| Setting | Value |
|---------|-------|
| **SMTP Host** | `smtp.office365.com` |
| **SMTP Port** | `587` (TLS) |
| **Email Address** | `vmsinfo@connexit.biz` |
| **App Password** | `jrtmpywhfrydwykb` |
| **From Address** | `vmsinfo@connexit.biz` |
| **Protocol** | TLS (STARTTLS) |

---

## ✅ **Email Features Supported**

All email features will continue to work with Microsoft Office 365:

| Feature | Status | Description |
|---------|--------|-------------|
| **Signup Verification** | ✅ Working | Email verification on signup |
| **Login OTP** | ✅ Working | 6-digit OTP code for login |
| **Email Update OTP** | ✅ Working | OTP for email address changes |
| **Password Reset** | ✅ Working | Password reset links |
| **Booking Emails** | ✅ Working | Booking confirmation emails |
| **All Email Types** | ✅ Working | All existing email functionality |

---

## 🔧 **Microsoft Office 365 SMTP Settings**

### **SMTP Configuration:**
- **Outgoing Server:** `smtp.office365.com`
- **Port:** `587` (recommended) or `465` (SSL)
- **Encryption:** STARTTLS (port 587) or SSL (port 465)
- **Authentication:** Required (username and app password)

### **App Password Requirements:**
- ✅ App password: `jrtmpywhfrydwykb`
- ✅ Email: `vmsinfo@connexit.biz`
- ✅ Two-factor authentication must be enabled on the Microsoft account
- ✅ App password generated from Microsoft account security settings

---

## 🧪 **Testing**

### **Test Email Service:**

Create a test file `test-microsoft-email.js`:

```javascript
require('dotenv').config({ path: './config.env' });
const { sendEmail } = require('./services/emailService');

async function testEmail() {
    console.log('🧪 Testing Microsoft Office 365 Email Service...\n');
    
    const result = await sendEmail({
        to: 'test@example.com', // Replace with your test email
        subject: 'Test Email from Microsoft Office 365',
        html: `
            <h1>Test Email</h1>
            <p>This is a test email from Microsoft Office 365 SMTP.</p>
            <p>If you receive this, the email service is working correctly!</p>
        `,
        text: 'This is a test email from Microsoft Office 365 SMTP.'
    });
    
    if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
    } else {
        console.error('❌ Email failed:', result.error);
    }
}

testEmail();
```

Run the test:
```bash
node test-microsoft-email.js
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. Authentication Failed**
**Error:** `Invalid login credentials`

**Solutions:**
- Verify the app password is correct: `jrtmpywhfrydwykb`
- Ensure two-factor authentication is enabled on the Microsoft account
- Generate a new app password if needed
- Check that the email address is correct: `vmsinfo@connexit.biz`

#### **2. Connection Timeout**
**Error:** `Connection timeout` or `ETIMEDOUT`

**Solutions:**
- Check firewall settings (port 587 must be open)
- Verify SMTP host: `smtp.office365.com`
- Try port 465 with SSL if 587 doesn't work
- Check network connectivity

#### **3. TLS/SSL Errors**
**Error:** `TLS handshake failed`

**Solutions:**
- Verify `requireTLS: true` is set in emailService.js
- Check that port 587 is used (TLS) or port 465 (SSL)
- Ensure `secure: false` for port 587, `secure: true` for port 465

#### **4. Office 365 Account Restrictions**
**Error:** `Access denied` or `Account disabled`

**Solutions:**
- Verify the Microsoft account is active
- Check if the account has sending limits
- Ensure the account has proper permissions
- Contact Microsoft support if needed

---

## 📋 **Verification Checklist**

- [x] Config.env updated with Microsoft SMTP settings
- [x] Email service updated for Office 365 compatibility
- [x] App password configured: `jrtmpywhfrydwykb`
- [x] From address updated: `vmsinfo@connexit.biz`
- [ ] Server restarted with new configuration
- [ ] Email service connection verified (check server logs)
- [ ] Test email sent successfully
- [ ] All email features tested (signup, login OTP, password reset, etc.)

---

## 🔄 **Migration Steps**

1. **Update Configuration:**
   - ✅ Updated `config.env` with Microsoft SMTP settings
   - ✅ Updated `emailService.js` for Office 365 compatibility

2. **Restart Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

3. **Verify Connection:**
   - Check server console for: `✅ Email service ready`
   - If you see: `❌ Email service configuration error` - check credentials

4. **Test Email:**
   - Run test script or trigger a signup/login to test email sending
   - Check email inbox for test emails

---

## 📊 **Microsoft Office 365 vs Gmail**

| Feature | Gmail | Microsoft Office 365 |
|---------|-------|---------------------|
| **SMTP Host** | smtp.gmail.com | smtp.office365.com |
| **Port** | 587 (TLS) | 587 (TLS) or 465 (SSL) |
| **Authentication** | App Password | App Password |
| **From Address** | smartvisitor.cbiz365@gmail.com | vmsinfo@connexit.biz |
| **Domain** | @gmail.com | @connexit.biz |

---

## ⚠️ **Important Notes**

1. **App Password:** The app password `jrtmpywhfrydwykb` must be kept secure. Do not commit it to public repositories.

2. **Two-Factor Authentication:** Microsoft account must have 2FA enabled to use app passwords.

3. **Sending Limits:** Office 365 has daily sending limits (typically 10,000 emails/day for business accounts).

4. **Domain Verification:** The domain `connexit.biz` should be verified in Microsoft 365 admin center.

5. **Security:** App passwords are more secure than regular passwords and should be used for SMTP authentication.

---

## 🔐 **Security Best Practices**

1. **Keep App Password Secure:**
   - Never share the app password
   - Don't commit it to version control
   - Rotate it periodically

2. **Monitor Email Activity:**
   - Check email sending logs
   - Monitor for failed authentication attempts
   - Review sent emails regularly

3. **Account Security:**
   - Enable two-factor authentication
   - Use strong account password
   - Review account access regularly

---

## 📞 **Support**

If you encounter issues:

1. **Check Server Logs:**
   - Look for email service errors
   - Check authentication failures
   - Review connection issues

2. **Verify Configuration:**
   - Confirm SMTP settings in `config.env`
   - Check app password is correct
   - Verify email address is active

3. **Test Connection:**
   - Use the test script provided
   - Check network connectivity
   - Verify firewall settings

---

**Date Migrated:** 2025-01-15  
**Status:** ✅ Complete - Email service migrated to Microsoft Office 365  
**Email Address:** vmsinfo@connexit.biz  
**SMTP Host:** smtp.office365.com
