# 📧 Email Sending Troubleshooting Guide

## Problem
When creating a booking from the admin page and clicking "Create Booking", emails fail to send even though the booking is created successfully.

## Quick Checks

### 1. **Check Server Console Logs**
Look for these messages in your server console:

**If you see:**
```
❌ Email service configuration error: ...
```
→ Email service is not properly configured

**If you see:**
```
📧 [AUTO EMAIL] Email service not configured! Please set SMTP_USER and SMTP_PASS in config.env
```
→ SMTP credentials are missing

**If you see:**
```
❌ FAILED: Invalid login credentials
```
→ SMTP password is incorrect (for Gmail, use App Password, not regular password)

**If you see:**
```
❌ FAILED: Connection timeout
```
→ SMTP server is unreachable or firewall is blocking

### 2. **Verify Email Configuration**

Check your `config.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=smartvisitor.cbiz365@gmail.com
SMTP_PASS=zxmnetqyszzraedv
EMAIL_FROM=smartvisitor.cbiz365@gmail.com
```

**Important for Gmail:**
- ✅ Use **App Password**, not your regular Gmail password
- ✅ Enable 2-Factor Authentication first
- ✅ Generate App Password: https://myaccount.google.com/apppasswords

### 3. **Test Email Service**

Create a test file `test-email-service.js`:

```javascript
require('dotenv').config({ path: './config.env' });
const { sendEmail } = require('./services/emailService');

async function testEmail() {
    console.log('Testing email service...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');
    
    const result = await sendEmail({
        to: 'your-test-email@gmail.com',
        subject: 'Test Email',
        html: '<p>This is a test email</p>',
        text: 'This is a test email'
    });
    
    console.log('Result:', result);
}

testEmail().catch(console.error);
```

Run it:
```bash
node test-email-service.js
```

## Common Error Messages & Solutions

### Error: "Email service not configured"
**Solution:**
1. Check `config.env` has `SMTP_USER` and `SMTP_PASS`
2. Restart your server after updating `config.env`

### Error: "Invalid login credentials"
**Solution:**
1. For Gmail, use App Password (not regular password)
2. Generate new App Password: https://myaccount.google.com/apppasswords
3. Update `SMTP_PASS` in `config.env`
4. Restart server

### Error: "Connection timeout" or "ECONNREFUSED"
**Solution:**
1. Check internet connection
2. Check firewall isn't blocking port 587
3. Try port 465 with `secure: true` in emailService.js
4. Check if your network blocks SMTP

### Error: "No participants found"
**Solution:**
1. Make sure participants are added to `external_participants` table
2. Participants must have valid email addresses
3. Check `booking_id` matches the booking

### Error: "Self-signed certificate" (if using custom SMTP)
**Solution:**
Already handled in code with `rejectUnauthorized: false`

## Step-by-Step Debugging

### Step 1: Check Email Service Initialization
When server starts, you should see:
```
✅ Email service ready
```

If you see an error, the email service isn't configured correctly.

### Step 2: Check Booking Creation
When creating a booking, check console for:
```
📧 [AUTO EMAIL] Booking created with ID: xxx, triggering automatic email sending...
📧 [AUTO EMAIL] Checking for participants... (Attempt 1/4)
```

### Step 3: Check Participant Detection
You should see:
```
📧 [AUTO EMAIL] Found X participants with emails for booking: Booking Name
```

If you see "No participants found", participants aren't linked to the booking.

### Step 4: Check Email Sending
For each participant, you should see:
```
✅ [AUTO EMAIL] Email sent successfully to participant@example.com
```

Or if it fails:
```
❌ [AUTO EMAIL] Failed to send email to participant@example.com
   Error: [error message]
```

## API Response Structure

When emails fail, the API now returns detailed error information:

```json
{
  "success": false,
  "message": "Email sending completed. 0 successful, 2 failed.",
  "data": {
    "emailsSent": 0,
    "emailsFailed": 2,
    "failedEmails": [
      {
        "participant": "John Doe",
        "email": "john@example.com",
        "error": "Invalid login credentials"
      }
    ]
  },
  "error": "Failed to send 2 email(s). Check server logs for details."
}
```

## Frontend Error Handling

In your frontend code, check the response:

```javascript
const result = await response.json();

if (!result.success) {
    // Show detailed error
    if (result.data.failedEmails) {
        result.data.failedEmails.forEach(failed => {
            console.error(`Failed to send to ${failed.email}: ${failed.error}`);
        });
    }
    alert(`Email sending failed: ${result.error || result.message}`);
} else {
    alert(`Emails sent successfully!`);
}
```

## Gmail-Specific Issues

### Issue: "Less secure app access" error
**Solution:** Gmail no longer supports "less secure apps". Use App Password instead.

### Issue: App Password not working
**Solution:**
1. Make sure 2FA is enabled
2. Generate a new App Password
3. Copy the 16-character password (no spaces)
4. Use it in `SMTP_PASS`

### Issue: "Access blocked" error
**Solution:**
1. Check if Google blocked the login attempt
2. Visit: https://accounts.google.com/DisplayUnlockCaptcha
3. Click "Continue" to unlock
4. Try again

## Alternative: Use Different Email Service

If Gmail continues to have issues, consider:

### Option 1: SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Option 2: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

## Testing Checklist

- [ ] Email service shows "ready" on server start
- [ ] `config.env` has all SMTP settings
- [ ] Gmail App Password is generated and used
- [ ] Server restarted after config changes
- [ ] Participants have valid email addresses
- [ ] Participants are linked to booking (`booking_id` matches)
- [ ] Network allows SMTP connections (port 587)
- [ ] Test email script works

## Still Not Working?

1. **Check server logs** - Look for detailed error messages
2. **Test email service directly** - Use the test script above
3. **Check network** - Try from different network
4. **Try different email provider** - Test with SendGrid or Mailgun
5. **Check database** - Verify participants exist and have emails

## Need More Help?

Check these files for more details:
- `services/emailService.js` - Email service implementation
- `controllers/bookingEmailController.js` - Email sending logic
- `controllers/secureInsertController.js` - Auto-email on booking creation

