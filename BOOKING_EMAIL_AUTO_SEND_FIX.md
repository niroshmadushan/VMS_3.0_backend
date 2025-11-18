# 📧 Booking Email Auto-Send Fix

## Problem
When creating a booking from the admin page (`http://localhost:3001/admin/bookings/new`), emails were not being sent automatically.

## Solution Implemented

### 1. **Automatic Email Sending on Booking Creation**
- When a booking is created, the system automatically checks for participants and sends confirmation emails
- Emails are sent in the background (non-blocking)

### 2. **Retry Mechanism**
- If participants aren't found immediately (they might be added after booking creation), the system retries up to 3 times
- Each retry waits 2 seconds before checking again
- This handles the case where booking is created first, then participants are added

### 3. **Email Sending on Participant Addition**
- When a participant is added to a booking, emails are automatically sent
- This ensures emails are sent even if participants are added after booking creation

## How It Works

### Flow 1: Booking Created First, Then Participants Added
1. Booking is created via `/api/secure-insert/bookings`
2. System tries to send emails (retries 3 times if no participants found)
3. When participants are added via `/api/secure-insert/external_participants`
4. System automatically sends emails to all participants

### Flow 2: Booking Created with Participants
1. Booking is created
2. Participants are added immediately
3. System finds participants and sends emails right away

## Email Configuration

Make sure your email service is properly configured in `config.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `SMTP_PASS`

## Console Logs

You'll see detailed logs in the server console:

### Success:
```
📧 [AUTO EMAIL] Booking created with ID: xxx, triggering automatic email sending...
📧 [AUTO EMAIL] Checking for participants... (Attempt 1/4)
📧 [AUTO EMAIL] Found 3 participants with emails for booking: Meeting Name
   ✅ [AUTO EMAIL] Email sent successfully to participant@example.com
📧 [AUTO EMAIL] Email sending completed: 3 sent, 0 failed
```

### Retry (if participants not found immediately):
```
📧 [AUTO EMAIL] No participants found yet. Retrying in 2 seconds... (1/3)
📧 [AUTO EMAIL] Checking for participants... (Attempt 2/4)
📧 [AUTO EMAIL] Found 2 participants with emails...
```

### Errors:
```
❌ [AUTO EMAIL] Failed to send email to participant@example.com
   Error: Invalid login credentials
```

## Troubleshooting

### Emails Not Sending?

1. **Check Email Configuration**
   ```bash
   # Verify config.env has correct SMTP settings
   cat config.env | grep SMTP
   ```

2. **Check Server Logs**
   - Look for `[AUTO EMAIL]` messages in console
   - Check for error messages

3. **Verify Participants Have Emails**
   - Participants must have valid email addresses in `external_participants` table
   - Email field must not be NULL or empty

4. **Test Email Service**
   ```javascript
   // Test email service directly
   const { sendEmail } = require('./services/emailService');
   sendEmail({
       to: 'test@example.com',
       subject: 'Test',
       html: '<p>Test</p>',
       text: 'Test'
   }).then(result => console.log(result));
   ```

5. **Check Database**
   ```sql
   -- Verify booking exists
   SELECT * FROM bookings WHERE id = 'your-booking-id';
   
   -- Verify participants exist with emails
   SELECT * FROM external_participants 
   WHERE booking_id = 'your-booking-id' 
   AND email IS NOT NULL 
   AND email != '';
   ```

## Email Logs

All email sending activity is logged to `booking_email_logs` table:

```sql
SELECT * FROM booking_email_logs 
WHERE booking_id = 'your-booking-id' 
ORDER BY sent_at DESC;
```

This shows:
- When emails were sent
- How many participants received emails
- Success/failure status for each participant

## Features

✅ **Automatic**: No manual API call needed  
✅ **Retry Logic**: Handles timing issues  
✅ **Non-Blocking**: Doesn't slow down booking creation  
✅ **Logged**: All activity recorded  
✅ **Error Handling**: Graceful failure handling  
✅ **Smart**: Only sends to participants with valid emails  

## Next Steps

1. Restart your server to apply changes
2. Create a test booking with participants
3. Check server console for email logs
4. Verify emails are received by participants

